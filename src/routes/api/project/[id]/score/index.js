import got from 'got';

import sClient from '../../../../../lib/sanity_client';

export async function get(req, res, next) {
  return sClient
    .getProjectScoreData(req.params.id)
    .then(project => {
      return got(project.sheetmusicFile).then(async response => {
        let mxml = response.body;
        const isCompressedExtension =
          path.extname(project.sheetmusicFile).toLowerCase() === '.mxl';
        if (isCompressedExtension) {
          mxml = await inflateCompressedMxml(response.body);
        }

        res.setHeader(
          'Content-type',
          'application/vnd.recordare.musicxml+xml; charset=utf-8'
        );
        res.end(mxml);
      });
    })
    .catch(next);
}
