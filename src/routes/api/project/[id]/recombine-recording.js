const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
// Create / Connect to a named work queue
const workQueue = new Queue('ffmpeg-work', REDIS_URL);

export function post(req, res, next) {
  return workQueue.add({ projectId: req.params.id }).then(jobId => {
    res.json({ status: 'ok', jobId });
  });
}
