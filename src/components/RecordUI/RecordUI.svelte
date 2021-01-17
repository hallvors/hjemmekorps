<script>
  import { onMount } from "svelte";
  //import DeltakerDisplay from "../ProjectMain/DeltakerDisplay.svelte";
  import LibLoader from "../utils/LibLoader.svelte";
  import NoteBox from "../ProjectMain/NoteBox.svelte";
  // TODO:
  //  - la bruker lytte til opptaket før det sendes, evt. ta på nytt
  //  - velge korrekt del av notene for akkurat den brukeren (!)
  //  - cursor, vis hvilken note som skal spilles
  //  - nedtelling ved start, korrekt tempoangivelse

  // På gang, kjente feil akkurat nå:
  // - nedtelling før start vises ikke, hvorfor? metronomeCounter et al
  // - notene ruller ned alt for fort, før "her er du"-indikator trenger det
  // - relatert: "her er du"-indikator pauser ikke når en pauser/stopper opptaket
  // - "her er du"-indikator må oppdate slutten av notene og stoppe opptaket automatisk
  // - trengs mere CSS og pynt
  // -

  export let project;
  export let user;
  var recorder, input, theStream;

  // variables for metronome countdown before recording
  var count = 1;
  var countdown = false;
  var countDelay = 1000;

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

  var meta = [];
  var startTime;

  var audioContext;

  onMount(async () => {
    AudioContext = window.AudioContext || window.webkitAudioContext;
    console.log(user.name, project.sheetmusicFile);
  });

  function start() {
    meta.push({ timestamp: 0 });
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        theStream = stream;
        audioContext = new AudioContext();
        input = audioContext.createMediaStreamSource(stream);
        recorder = new WebAudioRecorder(input, {
          workerDir: "/js/web-audio-recorder/lib-minified/",
          encoding: "wav",
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
    xhr.open("post", "/api/submit", true);
    if (user) {
      xhr.setRequestHeader("X-hjemmekorps-name", user._id);
    }
    if (project) {
      xhr.setRequestHeader("X-hjemmekorps-project", project._id);
    }
    xhr.onload = function () {
      document.body.className = "";
      document.getElementById("state-indicator").src = "/images/rec.png";
      alert("Ferdig! Opptaket er sendt. Tusen takk :)");
    };
    var fd = new FormData();
    fd.append("mp3", recordingData, "opptak.mp3");
    fd.append("meta", JSON.stringify(meta));
    meta = [];
    startTime = null;
    xhr.send(fd);
  }

  function startCountdown() {
    countdown = true;
    recState = RECORDING;
    setTimeout(metronomeCounter, countDelay);
  }
  function metronomeCounter() {
    if (count < 3) {
      count++;
      setTimeout(metronomeCounter, countDelay);
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
      recState = STOPPED;
    }
  }

  function stop() {
    if (recorder) {
      theStream.getAudioTracks()[0].stop();
      theBox.stopPlaythrough();
      recorder.finishRecording();
      recState = RECORDED_AUDIO;
    }
  }

  function endOfNote() {
    console.log("finished notification");
    stop();
  }

  function toggle(e) {
    if (recorder && recorder.isRecording()) {
      stop();
      document.body.className = "sending";
    } else {
      start();
      document.body.className = "recording";
    }
  }

  function playRecording() {
    if (recordingData) {
      var url = URL.createObjectURL(recordingData);
      audioElm.src = url;
      audioElm.play();
      audioElm.addEventListener("ended", () => {
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

<NoteBox
  {project}
  trackForPerson={user.name}
  showTracker={true}
  bind:this={theBox}
  on:finished={endOfNote}
/>

<!-- svelte-ignore a11y-media-has-caption -->
<audio bind:this={audioElm} on:ended={pausePlayRecording} />

{#if countdown}
  <div id="countdown">{count}</div>
{/if}

<nav id="rec-toolbar">
  {#if recState === STOPPED}
    <!-- initial state: start recording-button only -->
    <button on:click={start}>Ta opp</button>
  {:else if recState === RECORDING}
    <!-- pause button?, stop button -->
    <button on:click={stop}>Stopp opptak</button>
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
</style>
