<script>
  // Thanks, https://blog.paul.cx/post/metronome/ and https://github.com/cwilso/metronome
  // using the Worker approach from Chris W to simplify passing on the signal to
  // scripts modifying the DOM, but keeping the fancy sound from Paul.cx.
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher();
  export let tempo = 96;
  export let timeNumerator = 3;
  export let timeDenominator = 4;
  export let soundRecorder;
  export let audioContext;
  let fBuffer;
  let aBuffer;
  // How many 16ths are required for the countdown?
  // A typical 1 - 2 - 1 - 2 - 3 - 4 seems to be 2 measures, first counted at half speed
  // If a measure is 4 quarters, two are 32 16ths
  // So a 4/4 countdown is 32 16ths, 3/4 should be .. 24? 6/8 32?
  // for now use a 4/4 countdown for everything - TODO: improve..
  let countDown16ths;
  let countDownBeats;
  var unlocked = false;
  var isPlaying = false; // Are we currently playing?
  var startTime; // The start time of the entire sequence.
  // What note is currently last scheduled?
  var current16thNote = 0;
  var lookahead = 50.0; // How frequently to call scheduling function
  //(in milliseconds)
  var scheduleAheadTime = 0.2; // How far ahead to schedule audio (sec)
  // This is calculated from lookahead, and overlaps
  // with next interval (in case the timer is late)
  var nextHeartbeatTime = 0.0; // when the next 16th note is due (we may play a beat or not).

  const SIXTEENTHS = 0;
  const EIGTHS = 1;
  const QUARTERS = 2;
  const HALVES = 3;
  // resolution: beat on each ... note - basically the denominator in the time signature
  const resolutions = {
    '16': SIXTEENTHS,
    '8': EIGTHS,
    '4': QUARTERS,
    '2': HALVES,
  };
  $: noteResolution = resolutions[String(timeDenominator)]; // 0 == 16th, 1 == 8th, 2 == quarter note

  var timerWorker = null; // The Web Worker used to fire timer messages

  function setup() {
    if (typeof noteResolution === 'undefined') {
      noteResolution = QUARTERS; //TODO: what makes sense to do here?
    }
    // audioContext.sampleRate is 44100 (samples per second)
    // divide 44100 by 50 gets us 882 - number of samples for 1/50th = 0,02 second
    var duration_frames = audioContext.sampleRate / 50;
    // createBuffer arguments noOfChannels, length (in number of samples), sampleRate
    fBuffer = audioContext.createBuffer(1, duration_frames, audioContext.sampleRate);
    // array of numbers - sound data. 88200 0s at this point (two secs x 44100)
    var channel = fBuffer.getChannelData(0);
    const f = 330;
    for (let i = 0, phase = 0, amp = 1; i < duration_frames; i++) {
      channel[i] = Math.sin(phase) * amp;
      phase += (2 * Math.PI * f) / audioContext.sampleRate;
      if (phase > 2 * Math.PI) {
        phase -= 2 * Math.PI;
      }
      // volume drops to 0 during those 882 frames
      amp -= 1 / duration_frames;
    }

    aBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
    channel = aBuffer.getChannelData(0);
    const a = 440;
    for (let i = 0, phase = 0, amp = 1; i < duration_frames; i++) {
      channel[i] = Math.sin(phase) * amp;
      phase += (2 * Math.PI * a) / audioContext.sampleRate;
      if (phase > 2 * Math.PI) {
        phase -= 2 * Math.PI;
      }
      amp -= 1 / duration_frames;
    }
    // if we wanted to load audio files, etc., this is where we should do it.
    timerWorker = new Worker('/js/metronomeworker.js');

    timerWorker.onmessage = function (e) {
      if (e.data == 'tick') {
        scheduler();
      }
    };
    timerWorker.postMessage({ interval: lookahead });
  }

  onMount(setup);

  function scheduler() {
    // while there are notes that will need to play before the next interval,
    // schedule them and advance the pointer.
    while (nextHeartbeatTime < audioContext.currentTime + scheduleAheadTime) {
      scheduleNote(current16thNote, nextHeartbeatTime);

      // Advance current note and time by a 16th note...
      // Notice this picks up the CURRENT
      // tempo value and time signature to calculate beat length.
      var secondsPerBeat = 60.0 / tempo;
      // how many 16ths are there in one "denominator"? Well, 16 / denominator.
      // so next 16th is in seconds per beat divided by number of 16ths in a denominator
      nextHeartbeatTime += secondsPerBeat / (16 / timeDenominator); // Add beat length to last beat time

      current16thNote++; // Advance the beat number, wrap to zero
      if (current16thNote == timeNumerator * (16 / timeDenominator)) {
        current16thNote = 0;
      }
    }
  }

  function scheduleNote(beatNumber, time) {
    let recordBeat = false;
    if (countDown16ths) {
      // we're in countdown mode
      countDown16ths--;
      recordBeat = countDown16ths > 15;
      if (beatNumber === countDownBeats[0]) {
        countDownBeats.shift();
      } else {
        return; // no sound on this beat
      }
    } else {
      if (noteResolution == EIGTHS && beatNumber % 2) return; // we're not playing non-8th 16th notes
      if (noteResolution == QUARTERS && beatNumber % 4) return; // we're not playing non-quarter 8th notes
      if (noteResolution == HALVES && beatNumber % 8) return; // we're not playing non-half 4th notes
    }
    let source = audioContext.createBufferSource();
    if (beatNumber === 0 || countDown16ths) {
      // 0th beat in measure == high pitch
      source.buffer = aBuffer;
    } else {
      // non-0th beat = medium pitch
      source.buffer = fBuffer;
    }
    if (recordBeat) {
      source.connect(soundRecorder);
    }
    source.connect(audioContext.destination);
    source.start(time);
    let countdown = Boolean(countDown16ths);
    let countsLeft = countDownBeats.length;
    setTimeout(function () {
      dispatch('beat', {
        timestamp: audioContext.currentTime - startTime,
        countdown,
        countsLeft,
      });
    }, Math.max(0, (time - audioContext.currentTime) * 1000));
  }

  export function play() {
    if (!unlocked) {
      // play silent buffer to unlock the audio on certain platforms (hi Apple)
      var buffer = audioContext.createBuffer(1, 1, 22050);
      var node = audioContext.createBufferSource();
      node.buffer = buffer;
      node.start(0);
      unlocked = true;
    }

    isPlaying = true;
    countDown16ths = 31; // 32 beats, 31 - 0
    countDownBeats = [0, 8, 0, 4, 8, 12]; // 1, 2, 1, 2, 3, 4 ..
    current16thNote = 0;
    startTime = audioContext.currentTime;
    nextHeartbeatTime = audioContext.currentTime;
    timerWorker.postMessage('start');
  }
  // This stop method does not dispatch any events upwards
  // We expect the caller to take care of stopping other things..
  export function stop() {
    isPlaying = false;
    current16thNote = null;
    startTime = nextHeartbeatTime = 0.0;
    timerWorker.postMessage('stop');
  }

  export function toggle() {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }
</script>
