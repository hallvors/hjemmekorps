const ffmpeg = require('fluent-ffmpeg');
const got = require('got');
const tmp = require('tmp');
const fs = require('fs');
const path = require('path');
const sClient = require('./sanity_client');
const { tmpdir } = require('os');

const command = ffmpeg();

async function mergeSoundfiles(projectId) {
  const recordings = await sClient.getRecordings(projectId);
  const tmpDir = tmp.dirSync({
    unsafeCleanup: true,
    tmpdir: process.env.HOME,
    prefix: 'ffmpeg-wav-tmp',
  });
  // get recording.url
  const files = await Promise.all(
    recordings.map(recording => {
      return got(recording.url, { responseType: 'buffer' }).then(result => {
        const file = path.join(tmpDir.name, recording._id) + '.wav';
        const fHandle = fs.openSync(file, 'w');
        fs.writeFileSync(fHandle, result.body);
        fs.closeSync(fHandle);
        return file;
      });
    })
  );
  if (files.length === 1) {
    sClient.addCombinedRecording(projectId, files[0]);
    return;
  }

  const command = ffmpeg();
  // debug info..
  command.on('start', function (commandLine) {
    console.log('Spawned Ffmpeg with command: ' + commandLine);
  });
  command.on('error', function (error) {
    console.error('Ffmpeg dies with error: ' + error);
  });
  command.on('codecData', function (data) {
    console.log(
      'ffmpeg input is ' + data.audio + ' audio ' + 'with ' + data.video + ' video'
    );
  });
  files.forEach(file => {
    command.input(file); // TODO: add setStartTime() based on analysis of wav file
  });
  // -filter_complex amix=inputs=NUM:duration=longest
  command.complexFilter({
    filter: 'amix',
    options: { inputs: files.length, duration: 'longest' },
  });
  let filepath = path.join(tmpDir.name, 'combined.wav');
  command.on('end', function (stdout, stderr) {
    console.log('ffmpeg succeeded !');
    console.log(stdout, stderr);
    sClient.addCombinedRecording(projectId, filepath).then(() => {
      tmpDir.removeCallback();
    });
  });
  command.save(filepath);
}

module.exports = {
  mergeSoundfiles,
};
