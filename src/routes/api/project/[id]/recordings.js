import multer from 'multer';
import { compose } from 'compose-middleware';
import { mergeSoundfiles } from '../../../../lib/audio_helpers';

const multerUpload = multer({ dest: '/tmp' });

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
        req.file.path
      )
      .then(project => {
        res.json(project);
        return mergeSoundfiles(project._id);
      });
  },
]);
