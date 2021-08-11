import * as env from '../../config/environment';

// receives client-side performance data
// Data should have this structure:
/*
    {
        measurement: identifier of this measure - 
            a string like "render music"
        ua
        project
        userid
        ms
    }
*/
export async function post(req, res, next) {
  await env.logPerformanceData(req.body);

  res.json({status: 'ok'});
}
