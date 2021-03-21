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
      console.log('will get sound file ' + recording.url);
      if (recording.volume === 0) {
        return;
      }
      return got(recording.url, { responseType: 'buffer' }).then(result => {
        const file = path.join(tmpDir.name, recording._id) + '.wav';
        const fHandle = fs.openSync(file, 'w');
        fs.writeFileSync(fHandle, result.body);
        fs.closeSync(fHandle);
        console.log('done writing ', recording.url, file);
        return { file, volume: recording.volume };
      });
    })
  );
  files = files.filter(file => Boolean(file));
  console.log('sound files ' + files.length);
  if (files.length === 1) {
    return sClient.addCombinedRecording(projectId, files[0].file);
  }

  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    // debug info..
    command.on('start', function (commandLine) {
      console.log('Spawned Ffmpeg with command: ' + commandLine);
    });
    command.on('error', function (error) {
      console.error('Ffmpeg dies with error: ' + error);
      reject(error);
    });
    command.on('codecData', function (data) {
      console.log(
        'ffmpeg input is ' +
          data.audio +
          ' audio ' +
          'with ' +
          data.video +
          ' video'
      );
    });
    files.forEach(fileData => {
      command.input(fileData.file); // TODO: add setStartTime() based on analysis of wav file
    });

    /*
-filter_complex \
"[0:a]volume=0.8[a0]; \
[1:a]volume=0.8[a1]; \
[a0][a1]amix=inputs=2[a]" \

https://stackoverflow.com/questions/44712868/ffmpeg-set-volume-in-amix
*/
    command.complexFilter([
      files
        .map(
          (fileObj, idx) => `[${idx}:a]volume=${fileObj.volume / 100}[a${idx}]`
        )
        .join('; '),
      // -filter_complex amix=inputs=NUM:duration=longest
      {
        filter: 'amix',
        inputs: files.map((fileObj, idx) => `[a${idx}]`),
        options: {
          inputs: files.length,
          duration: 'longest',
        },
      },
    ]);
    let filepath = path.join(tmpDir.name, 'combined.wav');
    command.on('end', function (stdout, stderr) {
      console.log('ffmpeg succeeded !');
      console.log(stdout, stderr);
      sClient.addCombinedRecording(projectId, filepath).then(res => {
        tmpDir.removeCallback();
        resolve(res);
      });
    });
    command.save(filepath);
  });
}

module.exports = {
  mergeSoundfiles,
};
