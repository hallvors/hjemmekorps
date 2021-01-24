import sClient from '../../../../lib/sanity_client';

export async function get(req, res, next) {
  return sClient
    .getMembersOfBand(req.params.id)
    .then(members => {
      res.json(members);
    })
    .catch(next);
}
