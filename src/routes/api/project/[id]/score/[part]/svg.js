//import { generateSVGImage } from '../../../../../../lib/mxml_to_svg';
import sClient from '../../../../../../lib/sanity_client';
import got from 'got';

export async function get(req, res) {
  // We possibly have an SVG generated, either from the upload
  // or cached when rendered earlier..
  let svgMarkup;
    let url = await sClient.getPartFile(req.params.id, req.params.part);
    if (url) {
      let result = await got(url);
      if (result) {
        svgMarkup = result.body;
      }
    }
/*
  if (!svgMarkup) {
    let project = await sClient.getProjectScoreData(req.params.id);
    let result = await got(project.sheetmusicFile);
    let mxml = result.body;
    let array = await generateSVGImage(
      mxml,
      req.params.part,
      req.query.width || 0,
      req.query.height || 0,
      true
    );
    svgMarkup = array[0];
  }
*/
  //console.log(svgMarkup)
  if (svgMarkup) {
    res.setHeader('Content-type', 'image/svg+xml; charset=utf-8');
    res.end(svgMarkup);
  } else {
    res.statusCode = 404;
    res.end('');
  }
}
