import sClient from "../../../lib/sanity_client";

export async function post(req, res, next) {
	sClient.updateOrCreateMember(
		Object.assign({}, req.body.member, { _id: req.params.id }),
		req.body.bandId
	);
}
