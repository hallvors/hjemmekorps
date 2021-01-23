import sClient from "../../lib/sanity_client";

// POST /api/members for mass-updating or creating groups
// JSON required
// {members: [{name, instrument, phone, email ...}, ...], bandId: ..}

export async function post(req, res, next) {
	return await req.body.members.map((memberData) => {
		return sClient.updateOrCreateMember(memberData, req.body.bandId);
	});
}
