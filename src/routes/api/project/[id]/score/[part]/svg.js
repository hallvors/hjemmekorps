import { generateSVGImage } from '../../../../../../lib/mxml_to_svg';
import sClient from '../../../../../../lib/sanity_client';
import got from 'got';

export async function get(req, res, next) {
  let url = await sClient.getPartFile(req.params.id, req.params.part);
  let svgMarkup;
  if (url) {
    let result = await got(url);
    if (result) {
        console.log(result.body)
      svgMarkup = result.body;
    }
  }

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
  //console.log(svgMarkup)
  res.setHeader('Content-type', 'image/svg+xml; charset=utf-8');
  res.end(svgMarkup);
}
