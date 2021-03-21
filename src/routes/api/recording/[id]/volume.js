import sClient from '../../../../lib/sanity_client';

export function post(req, res, next) {
  return sClient.setVolume(req.params.id, req.body.volume).then(() => {
    res.json({ status: 'ok' });
  });
}
