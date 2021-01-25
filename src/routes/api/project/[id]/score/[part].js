//import osmd from 'opensheetmusicdisplay';
import sClient from '../../../../../lib/sanity_client'
import got from 'got';
import {generateSVGImage} from '../../../../../lib/mxml_to_svg';

export async function get(req, res, next) {
    let project = await sClient.getProjectScoreData(req.params.id)
    return got(project.sheetmusicFile)
    .then(result => {
        let mxml = result.body;
        return generateSVGImage(mxml, req.params.part, 0, 0, true)
        .then(svgMarkup => {
            console.log(svgMarkup)
            res.setHeader('Content-type', 'image/svg+xml; charset=utf-8');
            res.end(svgMarkup[0])
        })
    });
}