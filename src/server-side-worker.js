let throng = require('throng');
let Queue = require('bull');

const aHelpers = require('./lib/audio_helpers');

// Connect to a local redis instance locally, and the Heroku-provided URL in production
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
// Spin up multiple processes to handle jobs to take advantage of more CPU cores
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
let numberOfWorkers = process.env.WEB_CONCURRENCY || 2;

// The maximum number of jobs each worker should process at once. This will need
// to be tuned for your application. If each job is mostly waiting on network
// responses it can be much higher. If each job is CPU-intensive, it might need
// to be much lower.
let maxJobsPerWorker = 1;

function start(id, disconnect) {
  console.log('started worker ' + id);
  // Connect to the named work queue
  let workQueue = new Queue('processing-jobs', REDIS_URL);

  workQueue.process('sound-file-merge', maxJobsPerWorker, async job => {
    console.log('background worker merges sound files for ' + job.data.projectId, job);
    await aHelpers.mergeSoundfiles(job.data.projectId);
    console.log('background worker done');
    return { completed: true };
  });

  // polite cleanup
  process.on('SIGTERM', () => {
    console.log(`Worker ${id} exiting (cleanup here)`);
    workQueue.close();
    disconnect();
  });
}

// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
throng({ count: numberOfWorkers, worker: start,  lifetime: Infinity });
