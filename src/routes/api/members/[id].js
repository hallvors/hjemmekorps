import multer from 'multer';
import _ from 'underscore';
import { compose } from 'compose-middleware';

import sClient from '../../../lib/sanity_client';

const multerUpload = multer({ dest: '/tmp' });

// Updating a single member, perhaps also add photo
// Expects a typical multipart form with name, phone, email, instrument
// Instrument value should be pre-vetted

export const post = compose([
  multerUpload.single('photo'),
  async function post(req, res, next) {
    const data = await sClient.updateOrCreateMember(
      Object.assign(_.pick(req.body, 'name', 'phone', 'email', 'instrument', 'subgroup'), {
        _id: req.params.id,
      }),
      req.body.bandId,
      req.file ? req.file.path : null
    );

    res.json(data);
  },
]);
