<script>
  import { onMount, createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  import LibLoader from '../utils/LibLoader.svelte';
  import NoteBox from '../NoteBox/NoteBox.svelte';
  import Loading from '../Loading/Loading.svelte';

  export let project;
  export let user;
  var recorder, input, theStream;
  let unlocked = false;
  // variables for metronome countdown before recording
  let count = 0;
  let countdown = false;
  let first = true;
  let countdownNumbers;
  // name of the part this specific user will play
  let trackName;
  let hasPartFile = false;
  if (project.partslist) {
    for (let i = 0; i < project.partslist.length; i++) {
      if (
        project.partslist[i].members &&
        project.partslist[i].members.find(member => member._ref === user._id)
      ) {
        trackName = project.partslist[i].part;
        hasPartFile = Boolean(project.partslist[i].sheetmusic);
        break;
      }
    }
  }
  // recording states
  const STOPPED = 0;
  const RECORDING = 1;
  const PAUSED = 2;
  const RECORDED_AUDIO = 3;
  const PLAYING = 4;
  const SENDING = 5;
  var recState = STOPPED;
  // actual audio data we've recorded - obviously only available in RECORDED_AUDIO state
  var recordingData;
  // audio element for playback
  let audioElm;
  let analyser;

  var meta = [];

  var audioContext;
  var volumeInterval;
  let volumePercElm;
  let volumeLoud = false;

  onMount(() => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.minDecibels = -127;
    analyser.maxDecibels = 0;
    analyser.smoothingTimeConstant = 0.4;
  });

  function start() {
    if (!unlocked) {
      // play silent buffer to unlock the audio on certain platforms (hi Apple)
      var buffer = audioContext.createBuffer(1, 1, 22050);
      var node = audioContext.createBufferSource();
      node.buffer = buffer;
      node.connect(audioContext.destination);
      node.start(0);
      unlocked = true;
    }
    countdownNumbers = [1, 2, 1, 2, 3, 4];
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        theStream = stream;
        input = audioContext.createMediaStreamSource(stream);
        input.connect(analyser);

        const volumes = new Uint8Array(analyser.frequencyBinCount);
        const volumeCallback = () => {
          if (!volumePercElm) {
            // only exists while recording
            return;
          }
          analyser.getByteFrequencyData(volumes);
          let volume = 0;
          for (const vol of volumes) volume += vol;
          const averageVolume = parseInt(
            ((volume / volumes.length) * 100) / 127
          );
          volumePercElm.style.width = averageVolume + '%';
          volumeLoud = averageVolume > 92 ? true : false;
        };
        volumeInterval = setInterval(volumeCallback, 200);
        recorder = new WebAudioRecorder(analyser, {
          workerDir: '/js/web-audio-recorder/lib-minified/',
          encoding: 'wav',
        });
        recorder.onComplete = function (recorder, blob) {
          recordingData = blob;

          var url = URL.createObjectURL(recordingData);
          audioElm.src = url;
          audioElm.controls = true;
        };

        recorder.setOptions({
          timeLimit: 360,
          encodeAfterRecord: false,
          //mp3: { bitRate: 160 },
        });

        first = true;
        //start the recording process
        recorder.startRecording();
        dispatch('start'); // starts playing other tracks - if any
        theBox.initPlaythrough(); // Tell NoteBox to start metronome
      });
  }

  function sendRecording() {
    recState = SENDING;
    var xhr = new XMLHttpRequest();
    xhr.open('post', '/api/project/' + project._id + '/recordings', true);
    xhr.onload = function () {
      alert('Ferdig! Opptaket er sendt. Tusen takk :)');
      recState = STOPPED;
      recordingData = null;
      audioElm.controls = false;
    };
    var fd = new FormData();
    fd.append('file', recordingData, 'opptak.wav');
    fd.append('memberId', user._id);
    fd.append('instrument', user.instrument);
    fd.append('projectId', project._id);
    fd.append('meta', JSON.stringify(meta));
    meta = [];
    xhr.send(fd);
  }
  function countdownUiUpdate(evt) {
    count = countdownNumbers.shift();
    countdown = true;
    if (evt.detail.lastCountdown) {
      setTimeout(() => {
        countdown = false;
      }, 100);
    }
    recState = RECORDING;
  }

  function cancel() {
    if (recorder) {
      try {
        recorder.cancelRecording();
      } catch (e) {
        console.log(e);
      }

      theBox.stopPlaythrough();
      recordingData = null;
      audioElm.controls = false;
      audioElm.pause();
      meta = [];
      clearInterval(volumeInterval);
      count = 0;
      recState = STOPPED;
    }
  }

  function stop() {
    if (recorder) {
      theStream.getAudioTracks()[0].stop();
      theBox.stopPlaythrough();
      recorder.finishRecording();
      dispatch('stop');

      recState = RECORDED_AUDIO;
      clearInterval(volumeInterval);
    }
  }

  function endOfNote() {
    clearInterval(volumeInterval);
    stop();
  }

  function toggle(e) {
    if (recorder && recorder.isRecording()) {
      stop();
    } else {
      start();
    }
  }

  function pausePlayRecording() {
    audioElm.pause();
    recState = RECORDED_AUDIO;
  }

  var theBox;
</script>

<LibLoader
  src="/js/web-audio-recorder/lib-minified/WebAudioRecorder.min.js"
  libraryDetectionObject="WebAudioRecorder"
/>

{#if countdown}
  <div id="countdown">{count}</div>
{/if}

<nav id="rec-toolbar">
  {#if recState === STOPPED}
    <!-- initial state: start recording-button only -->
    <div class="start-stop-btn" on:click={start}><div>Ta opp</div></div>
  {:else if recState === RECORDING}
    <!-- pause button?, stop button -->
    <div class="start-stop-btn" on:click={stop}>
      <div>Stopp opptak</div>
      <div id="volume"><span bind:this={volumePercElm} class:volumeLoud /></div>
    </div>

    <!-- {:else if recState === PAUSED}
    resume button, stop button -->
  {:else if recState === RECORDED_AUDIO}
    <!-- Listen button, send button, delete button -->
    <!-- <button on:click={playRecording}>Hør på opptak</button> -->
    <div class="recording-btn-wrapper">
      <div class="half-btn" on:click={sendRecording}><div>Send opptak</div></div>
      <div class="half-btn" on:click={cancel}><div>Slett opptak</div></div>
    </div>
  {:else if recState === SENDING}
    <Loading message="Sender..." />
  {/if}

  <!-- svelte-ignore a11y-media-has-caption -->
  <audio
    id="audio-elm"
    class={recordingData === 0 ? 'hide' : ''}
    bind:this={audioElm}
    on:ended={pausePlayRecording}
  />
</nav>

<NoteBox
  {project}
  {trackName}
  {audioContext}
  soundRecorder={analyser}
  {hasPartFile}
  {meta}
  bind:this={theBox}
  on:ended={endOfNote}
  on:countdown={countdownUiUpdate}
  on:measuretime
/>

<style>
  #countdown {
    position: fixed;
    width: 100%;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 300;
    background: rgba(200, 200, 200, 0.4);
    font-size: 6em;
    text-align: center;
    padding-top: 3em;
  }
  #volume {
    width: 100%;
    position: absolute;
    border: none;
    bottom: 0;
    left: 50%;
    -ms-transform: translateX(-50%);
    transform: translateX(-50%);
    font-size: 7rem;
  }
  #volume span {
    background-color: rgb(15, 83, 55);
    width: 100%;
    border-top: 6px dotted rgb(2, 148, 2);
    display: inline-block;
  }
  #volume span.volumeLoud {
    background-color: rgb(160, 27, 34);
    border-top-color: red;
  }

  #rec-toolbar {
    position: fixed;
    z-index: 2;
    width: 100%;
    left: 0;
    top: var(--navbarHeight); /* Navbarheight */
    background-color: var(--light);
    border: var(--border);
    border-top: none;
    text-align: center;
    font-weight: 300;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  @media (min-width: 1280px) {
    #rec-toolbar {
      width: 70%;
      left: 15%;
    }
  }

  .recording-btn-wrapper {
    height: 70%;
    display: flex;
  }

  .half-btn {
    width: 50%;
    font-size: 8vw;
  }
  .half-btn:hover {
    cursor: pointer;
    background-color: #f5f5f5;
  }
  #audio-elm {
    width: 100%;
  }

  #audio-elm.hide {
    display: none;
  }

  .start-stop-btn {
    width: 100%;
    height: 100%;
  }
  .start-stop-btn:hover {
    background-color: #f5f5f5;
    cursor: pointer;
  }

  .start-stop-btn div,
  .half-btn div {
    margin: 0;
    font-size: 8vw;
    line-height: 8vw;
    text-align: center;
  }
</style>
