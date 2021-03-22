import multer from 'multer';
import Queue from 'bull';
import { compose } from 'compose-middleware';

const multerUpload = multer({ dest: '/tmp' });
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
// Create / Connect to a named work queue
const workQueue = new Queue('processing-jobs', REDIS_URL);

import sClient from '../../../../lib/sanity_client';

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
        return workQueue.add('sound-file-merge', {projectId: project._id});
      });
  },
]);

workQueue.on('global:completed', (jobId, result) => {
  console.log(`Job completed with result ${result}`);
});