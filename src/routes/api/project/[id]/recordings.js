import multer from 'multer';
import Queue from 'bull';
import { compose } from 'compose-middleware';
import Handlebars from 'handlebars';
import * as fs from 'fs';
import { join } from 'path';
import { sign } from 'jsonwebtoken';
import * as env from '../../../../config/environment';

const multerUpload = multer({ dest: '/tmp' });
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
// Create / Connect to a named work queue
const workQueue = new Queue('processing-jobs', REDIS_URL);

import sClient from '../../../../lib/sanity_client';
import { send } from '../../../../lib/mail';

const templateText = fs.readFileSync(
  join('src', 'templates', 'mail', 'recording_notification.hbs.txt'),
  { encoding: 'utf8', flag: 'r' }
);
const templateHTML = fs.readFileSync(
  join('src', 'templates', 'mail', 'recording_notification.hbs.html'),
  { encoding: 'utf8', flag: 'r' }
);

// TODO: this get may be obsolete, we include recording data in project response now
export async function get(req, res, next) {
  return sClient.getRecordings(req.params.id).then(recordings => {
    res.json(recordings);
  });
}

export const post = compose([
  multerUpload.single('file'),
  function (req, res, next) {
    return sClient
      .addProjectRecording(
        req.body.projectId,
        req.body.memberId,
        req.body.instrument,
        JSON.parse(req.body.meta || '[]'),
        req.file.path
      )
      .then(project => {
        res.json(project);
        return workQueue
          .add('sound-file-merge', { projectId: project._id })
          .then(() => {
            // Send the person who submitted this task a notification
            // that someone did it!
            return Promise.all([
              sClient.getAdminUserDataById(project.owner._ref),
              sClient.getUserData(req.body.memberId),
            ]).then(([adminUser, user]) => {
              let templatePlain = Handlebars.compile(templateText);
              let templateRich = Handlebars.compile(templateHTML);
              const token = sign(
                { email: adminUser.email },
                env.config.site.tokensecret
              );
              const link = `https://${env.hostname}/prosjekt/${project._id}/opptak?t=${token}`;
                const data = {
                  project,
                  adminUser,
                  user,
                  hostname: env.hostname,
                  link,
                };
              return send(
                adminUser.email,
                user,
                'Nytt opptak',
                templatePlain(data),
                templateRich(data)
              );
            });
          });
      })
      .catch(next);
  },
]);

workQueue.on('global:completed', (jobId, result) => {
  console.log(`Job completed with result ${result}`);
});
