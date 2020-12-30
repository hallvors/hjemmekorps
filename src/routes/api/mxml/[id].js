import got from 'got';

import sClient from "../../../lib/sanity_client";

export async function get(req, res, next) {
	return sClient.getProject(req.user._id, req.params.id).then((project) => {
		console.log('getting sheet music', project)
		return got(project.sheetmusicFile)
		.then(response => {
			console.log('got response')
			console.log(response.body)
			res.setHeader('Content-type', 'application/vnd.recordare.musicxml+xml; charset=utf-8');
			res.end(response.body);
		});
	}).catch(next);
};
