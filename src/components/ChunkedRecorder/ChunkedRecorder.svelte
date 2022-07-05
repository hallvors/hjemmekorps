<script>
  /*
    We record one "chunk" of sound per measure,
    using MediaRecorder if available. We fall back
    on old WebAudioRecorder.js

    Formats and codecs:
    If MediaRecorder, we accept whatever format 
    the browser defaults to, assuming the 
    browser can play back its own thing.
    We also assume that FFMPEG on the server
    can handle anything the browser will
    throw at it (and that we will not
    process the sound so many times that
    lossy -> lossy transform is a real issue.)
    
    If no MediaRecorder, we ask WebAudioRecorder
    for MP3.

  */
  import LibLoader from '../utils/LibLoader.svelte';
  import { logPerfStats } from '../utils/logging';
  export let measureCount;
  let mediaRecorder;
  let oldMeasureCount;
  const chunks = [];

  // reactive declaration on measureCount change
  // this should trigger a requestData() whenever
  // measureCount changes so we save data per measure
  // Also ensures this code runs when the stream becomes
  // available..
  $: {
    if (typeof measureCount === 'number' && measureCount !== oldMeasureCount) {
      if (measureCount < oldMeasureCount) {
        // re-recording something, drop data..
        chunks.length = measureCount;
      }
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.requestData();
      }
      oldMeasureCount = measureCount;
    }
  }

  function initRecorder(stream, audioNode) {
    console.log('do we have a stream?', stream);
    if (stream) {
      if (typeof MediaRecorder !== 'undefined') {
        console.log('chunked recorder will use MediaRecorder API');
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = function (e) {
          console.log('recording data available', chunks.length);
          chunks.push(e.data);
        };
      } else {
        console.log('chunked recorder falls back to WebAudioRec');
        mediaRecorder = createWebAudioRecorder(audioNode);
      }
    }
  }

  export function resetRecording() {
    chunks.length = 0;
  }

  export function startRecording(stream, audioNode) {
    initRecorder(stream, audioNode);
    if (mediaRecorder) {
      mediaRecorder.start();
    }
  }

  export function stopRecording() {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  }

  export function play() {
    const audio = document.getElementById('aelm');
    if (mediaRecorder) {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      audio.play();
    }
  }

  export function stop() {
    const audio = document.getElementById('aelm');
    audio.pause();
    audio.src = null; // try to release the blob
  }

  export function sendRecording(project) {
    let perfmeasure = Date.now();
    var xhr = new XMLHttpRequest();
    xhr.open('post', '/api/project/' + project._id + '/recordings', true);
    xhr.onload = function () {
      alert('Ferdig! Opptaket er sendt. Tusen takk :)');
      chunks = [];
      logPerfStats({
        measurement: 'submit-recording',
        project: project._id,
        userid: user._id,
        ms: Date.now() - perfmeasure,
      });
    };
    var fd = new FormData();
    fd.append(
      'file',
      new Blob(chunks, { type: mediaRecorder.mimeType }),
      'opptak'
    );
    fd.append('memberId', user._id);
    fd.append('instrument', user.instrument);
    fd.append('projectId', project._id);
    fd.append('type', mediaRecorder.mimeType);
    fd.append('meta', JSON.stringify(meta));
    meta = [];
    xhr.send(fd);
  }

  function createWebAudioRecorder(audioNode) {
    const mediaRecorder = new WebAudioRecorder(audioNode, {
      workerDir: '/js/web-audio-recorder/lib-minified/',
      encoding: 'mp3',
    });
    mediaRecorder.mimeType = 'audio/mpeg';
    mediaRecorder.start = function () {
      mediaRecorder.startRecording();
      mediaRecorder.state = 'recording';
    };
    mediaRecorder.stop = function () {
      mediaRecorder.finishRecording();
      mediaRecorder.state = 'inactive';
    };
    mediaRecorder.onComplete((rec, blob) => {
      chunks.push(blob);
    });
    mediaRecorder.requestData = function () {
      mediaRecorder.finishRecording();
      recreateRecorder();
    };
    return mediaRecorder;
  }
  // TODO: no idea if this restart approach performs well enough..
  function recreateRecorder() {
    mediaRecorder = createWebAudioRecorder();
    mediaRecorder.start();
  }
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<audio id="aelm" />

{#if !window.MediaRecorder}
  <LibLoader
    src="/js/web-audio-recorder/lib-minified/WebAudioRecorder.min.js"
    libraryDetectionObject="WebAudioRecorder"
  />
{/if}
