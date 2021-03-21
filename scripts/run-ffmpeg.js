const aHelpers = require('../src/lib/audio_helpers');

const projectId = process.argv[2];
if (!projectId) {
  console.error('missing argument: projectId');
  process.exit(1);
}

console.log('will merge recordings for ' + projectId);

aHelpers.mergeSoundfiles(projectId).then(res => {
  console.log('done');
  console.log(res);
});
