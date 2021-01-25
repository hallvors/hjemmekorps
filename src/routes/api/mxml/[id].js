import got from 'got';

import sClient from "../../../lib/sanity_client";

export async function get(req, res, next) {
	return sClient.getProjectScoreData(req.params.id).then((project) => {
		return got(project.sheetmusicFile)
		.then(response => {
			res.setHeader('Content-type', 'application/vnd.recordare.musicxml+xml; charset=utf-8');
			res.end(response.body);
		});
	}).catch(next);
};
