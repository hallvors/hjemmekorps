import multer from 'multer';

const storage = multer.memoryStorage();
const multerUpload = multer({ storage: storage });

const OPT_MAKE_SVG = false;

import sClient from '../../lib/sanity_client';
import { generateSVGImage } from '../../lib/mxml_to_svg';
import {
  parseFile,
  getName,
  getMemberNames,
  getPartsList,
} from '../../lib/mxml_helpers';

export async function get(req, res, next) {
  return sClient.getProjects(req.user._id).then(projects => {
    res.json(projects);
  });
}

export async function post(req, res, next) {
  multerUpload.single('file')(req, res, () => {
    if (!req.file) {
      res.statusCode = 400;
      return res.json({ error: 'Missing files' });
    }
    const bandId = req.body.band;
    const mxlmData = parseFile(req.file);
    return sClient.getMembers(bandId).then(bandMembers => {
      const partslist = getPartsList(mxlmData);
      const projName = getName(mxlmData);
      return sClient
        .addProject(
          req.user._id,
          bandId,
          req.body.projectId,
          projName,
          req.file,
          partslist,
          req.body.bpm,
          bandMembers
        )
        .then(project => {
          res.json(project);
          if (OPT_MAKE_SVG) {
            // TODO: how to make Polka / Node HTTP server flush data HERE?
            // user should not wait for the slow parts below..
            // process parts, convert to SVG. Hmm.. timeout?
            setTimeout(function () {
              return Promise.all(
                project.partslist.map(async partinfo => {
                  const svgMarkup = await generateSVGImage(
                    req.file.buffer.toString('utf-8'),
                    partinfo.part,
                    800,
                    0,
                    true
                  );
                  if (svgMarkup[0]) {
                    return await sClient.addPartFile(
                      project._id,
                      partinfo.part,
                      Buffer.from(svgMarkup[0], 'utf8')
                    );
                  } else {
                    console.error('No SVG generated for ' + partinfo.part);
                    console.error(svgMarkup);
                  }
                })
              );
            }, 1);
          }
        });
    });
  });
}
