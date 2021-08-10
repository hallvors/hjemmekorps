import * as env from '../../config/environment';

// receives client-side errors
export async function post(req, res, next) {
  await env.logClientSideError(req);

  res.json({status: 'ok'});
}
