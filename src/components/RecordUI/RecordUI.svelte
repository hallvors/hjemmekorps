<script>
  import { onMount } from 'svelte';
  //import DeltakerDisplay from "../ProjectMain/DeltakerDisplay.svelte";
  import LibLoader from '../utils/LibLoader.svelte';
  import NoteBox from '../ProjectMain/NoteBox.svelte';
  // TODO:
  //  - velge korrekt del av notene for akkurat den brukeren (!)
  //  - nedtelling ved start ignorerer opptakt :(
  // - trengs mere CSS og pynt
  // -

  export let project;
  export let user;
  var recorder, input, theStream;

  // variables for metronome countdown before recording
  let count = 1;
  let countdown = false;
  let firstCount = true;
  let countDelay = 1000; // TODO!!
  let trackName;
  if (project.partslist) {
    for (let i = 0; i < project.partslist.length; i++) {
      if (
        project.partslist[i].members &&
        project.partslist[i].members.find(member => member._ref === user._id)
      ) {
        trackName = project.partslist[i].part;
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
  var recState = STOPPED;
  // actual audio data we've recorded - obviously only available in RECORDED_AUDIO state
  var recordingData;
  // audio element for playback
  let audioElm;
  let snapElm;

  var meta = [];
  var startTime;

  var audioContext;
  var volumeInterval;
  let volumePercElm;
  let volumeLoud = false;

  onMount(async () => {
    AudioContext = window.AudioContext || window.webkitAudioContext;
  });

  function start() {
    meta.push({ timestamp: 0 });
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        theStream = stream;
        audioContext = new AudioContext();
        input = audioContext.createMediaStreamTrackSource(
          stream.getAudioTracks()[0]
        );
        let snapSource = audioContext.createMediaElementSource(snapElm);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.minDecibels = -127;
        analyser.maxDecibels = 0;
        analyser.smoothingTimeConstant = 0.4;
        snapSource.connect(audioContext.destination);
        snapSource.connect(analyser);
        input.connect(analyser);

        const volumes = new Uint8Array(analyser.frequencyBinCount);
        const volumeCallback = () => {
          analyser.getByteFrequencyData(volumes);
          let volume = 0;
          for (const vol of volumes) volume += vol;
          const averageVolume = parseInt(
            ((volume / volumes.length) * 100) / 127
          );
          volumePercElm.style.width = averageVolume + '%';
          volumeLoud = averageVolume > 90 ? true : false;
        };
        volumeInterval = setInterval(volumeCallback, 200);
        recorder = new WebAudioRecorder(analyser, {
          workerDir: '/js/web-audio-recorder/lib-minified/',
          encoding: 'wav',
        });
        recorder.onComplete = function (recorder, blob) {
          recordingData = blob;
        };

        recorder.setOptions({
          timeLimit: 360,
          encodeAfterRecord: false,
          //mp3: { bitRate: 160 },
        });

        startTime = new Date();
        //start the recording process
        recorder.startRecording();
        startCountdown();
      });
  }

  function sendRecording() {
    var xhr = new XMLHttpRequest();
    xhr.open('post', '/api/project/' + project._id + '/recordings', true);
    xhr.onload = function () {
      document.body.className = '';
      //document.getElementById("state-indicator").src = "/images/rec.png";
      alert('Ferdig! Opptaket er sendt. Tusen takk :)');
    };
    var fd = new FormData();
    fd.append('file', recordingData, 'opptak.wav');
    fd.append('memberId', user._id);
    fd.append('projectId', project._id);
    fd.append('meta', JSON.stringify(meta));
    meta = [];
    startTime = null;
    xhr.send(fd);
  }

  function startCountdown() {
    countdown = true;
    recState = RECORDING;
    snapElm.play();
    setTimeout(metronomeCounter, countDelay);
  }
  function metronomeCounter() {
    if (count === 2 && firstCount) {
      count = 0;
      firstCount = false;
    }
    if (count < 4) {
      count++;
      snapElm.play();
      setTimeout(metronomeCounter, firstCount ? countDelay : countDelay / 2);
    } else {
      countdown = false;
      theBox.initPlaythrough();
    }
  }
  function cancel() {
    if (recorder) {
      recorder.cancelRecording();
      theBox.stopPlaythrough();
      startTime = null;
      recordingData = null;
      meta = [];
      firstCount = true;
      count = 1;
      recState = STOPPED;
    }
  }

  function stop() {
    if (recorder) {
      theStream.getAudioTracks()[0].stop();
      theBox.stopPlaythrough();
      recorder.finishRecording();
      recState = RECORDED_AUDIO;
      clearInterval(volumeInterval);
    }
  }

  function endOfNote() {
    console.log('finished notification');
    stop();
  }

  function toggle(e) {
    if (recorder && recorder.isRecording()) {
      stop();
      document.body.className = 'sending';
    } else {
      start();
      document.body.className = 'recording';
    }
  }

  function playRecording() {
    if (recordingData) {
      var url = URL.createObjectURL(recordingData);
      audioElm.src = url;
      audioElm.play();
      audioElm.addEventListener('ended', () => {
        recState = RECORDED_AUDIO;
      });
      recState = PLAYING;
    }
  }

  function pausePlayRecording() {
    audioElm.pause();
    recState = RECORDED_AUDIO;
  }

  var theBox;
  function debugmsg(msg) {
    console.log(msg);
  }
</script>

<LibLoader
  src="/js/web-audio-recorder/lib-minified/WebAudioRecorder.min.js"
  on:load={debugmsg}
  libraryDetectionObject="WebAudioRecorder"
/>

<!-- svelte-ignore a11y-media-has-caption -->
<audio bind:this={audioElm} on:ended={pausePlayRecording} />

<!-- svelte-ignore a11y-media-has-caption -->
<audio bind:this={snapElm} src="/samples/snap.mp3" preload />

{#if countdown}
  <div id="countdown">{count}</div>
{/if}

<nav id="rec-toolbar">
  Hei {user.name}! 
  {#if recState === STOPPED}
    <!-- initial state: start recording-button only -->
    <button on:click={start}>Ta opp</button>
  {:else if recState === RECORDING}
    <!-- pause button?, stop button -->
    <button on:click={stop}>Stopp opptak</button>
    <br />
    <div id="volume"><span bind:this={volumePercElm} class:volumeLoud /></div>
  {:else if recState === PAUSED}
    <!-- resume button, stop button -->
  {:else if recState === RECORDED_AUDIO}
    <!-- Listen button, send button, delete button -->
    <button on:click={playRecording}>Hør på opptak</button>
    <button on:click={sendRecording}>Send opptak</button>
    <button on:click={cancel}>Slett opptak</button>
  {:else if recState === PLAYING}
    <button on:click={pausePlayRecording}>Pause</button>
  {/if}

  <!-- 
	<button id="waste-btn"><img
		src="/images/kast.png"
		alt="Avbryt opptak" /></button>
		<span id="state-indicator" />
		<button id="send-btn"><img
			src="/images/send.png"
			alt="Send opptak til lærer" /></button>
-->
</nav>

<NoteBox
  {project}
  {trackName}
  showTracker={true}
  bind:this={theBox}
  on:finished={endOfNote}
/>

<style>
  #countdown {
    position: fixed;
    width: 100%;
    top: 10%;
    left: 0;
    height: 50%;
    z-index: 3;
    background: rgba(200, 200, 200, 0.6);
    font-size: 6em;
    text-align: center;
    padding-top: 3em;
  }
  #volume {
    width: 200px;
    height: 20px;
    position: relative;
    border: 1px solid grey;
  }
  #volume span {
    position: absolute;
    height: 100%;
    border-top: 10px dotted green;
    display: inline-block;
  }
  #volume span.volumeLoud {
    border-top-color: red;
  }
</style>
