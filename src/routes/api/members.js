import sClient from "../../lib/sanity_client";

// POST /api/members for mass-updating or creating groups
// JSON preferred

export async function post(req, res, next) {
	console.log(req.body.members);
	return res.send('ok');
	return await req.body.members.map((memberData) => {
		return sClient.updateOrCreateMember(memberData, req.body.bandId);
	});
}
