import {generateSVGImage} from '../../../../../../lib/mxml_to_svg';
import sClient from '../../../../../../lib/sanity_client';
import got from 'got';

export async function get(req, res, next) {
    let project = await sClient.getProjectScoreData(req.params.id)
    return got(project.sheetmusicFile)
    .then(result => {
        let mxml = result.body;
        return generateSVGImage(mxml, req.params.part, req.query.width || 0, req.query.height || 0, true)
        .then(svgMarkup => {
            //console.log(svgMarkup)
            res.setHeader('Content-type', 'image/svg+xml; charset=utf-8');
            res.end(svgMarkup[0])
        })
    });
}
