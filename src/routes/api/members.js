import sClient from '../../lib/sanity_client';

// POST /api/members for mass-updating or creating groups
// JSON required
// {members: [{name, instrument, phone, email ...}, ...], bandId: ..}

export async function post(req, res, next) {
  let results = await Promise.all(
    req.body.members.map(memberData => {
      return sClient.updateOrCreateMember(memberData, req.body.bandId);
    })
  );
  return sClient.getMembers(req.body.bandId).then(results => res.json(results));
}
