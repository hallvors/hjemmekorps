<script>
  // Thanks, https://blog.paul.cx/post/metronome/ and https://github.com/cwilso/metronome
  // using the Worker approach from Chris W to simplify passing on the signal to
  // scripts modifying the DOM, but keeping the fancy sound from Paul.cx.
  import { createEventDispatcher, onMount } from 'svelte';
  const dispatch = createEventDispatcher();

  /**
   * Our good metronome needs to know three things:
   * - what is the delay until next expected beat?
   * - is this beat the first beat in a measure (for accent)?
   * - is this beat silent or sounded (for dotted units etc)?
   *
   * If we have a 4/4 and quarter = 120, no dot - easy.
   * - delay is 60 / 120
   * - first beat is nextBeatCounter = 0
   * - every beat is sounded
   *
   * If we have a 6/8 and eight dotted = 120 it's a bit trickier
   * - we actually want to send beat events for each eight
   * - however, only beats 0 and 3 sould be sounded
   * - and we should have 120 of those *sounded* beats per min
   *
   */

  export let timeNumerator = 4;
  export let nthBeatSounded;
  export let delayBetweenBeats;
  export let audioContext;
  let fBuffer;
  let aBuffer;
  // How many beats are required for the countdown?
  let countDownBeats;
  var isPlaying = false; // Are we currently playing?
  var startTime; // The start time of the entire sequence.
  // What note is currently last scheduled?
  var lookahead = 60.0; // How frequently to call scheduling function
  //(in milliseconds)
  var scheduleAheadTime = 0.15; // How far ahead to schedule audio (sec)
  // This is calculated from lookahead, and overlaps
  // with next interval (in case the timer is late)
  let nextBeatCounter;
  var nextBeatTime = 0.0; // when the next 16th note is due (we may play a beat or not).
  var measureCount = 0;
  var timerWorker = null; // The Web Worker used to fire timer messages

  function setup() {
    fBuffer = makeBuffer(audioContext, 330);
    aBuffer = makeBuffer(audioContext, 440);
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
    while (nextBeatTime < audioContext.currentTime + scheduleAheadTime) {
      scheduleBeat(measureCount, nextBeatCounter, nextBeatTime);

      // Add beat length to last beat time
      nextBeatTime += delayBetweenBeats;

      // Advance the beat number, wrap to zero
      nextBeatCounter++;
      if (nextBeatCounter >= timeNumerator) {
        nextBeatCounter = 0; // new measure..
        measureCount++;
      }
    }
  }

  function scheduleBeat(measure, beatNumber, time) {
    let recordBeat = false;
    let hasPulse = beatNumber % nthBeatSounded === 0;
    // In countdown mode, some beats are silent
    // even if they would normally be sounded..
    if (hasPulse && countDownBeats.length && !countDownBeats[0]) {
      hasPulse = false;
    }

    if (hasPulse && countDownBeats.length) {
      recordBeat = countDownBeats.length > 6;
    }

    if (hasPulse) {
      let source = audioContext.createBufferSource();
      if (beatNumber === 0) {
        // 0th beat in measure == high pitch
        source.buffer = aBuffer;
      } else {
        // non-0th beat = medium pitch
        source.buffer = fBuffer;
      }

      var gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      source.start(Math.max(time, audioContext.currentTime));
    }

    let beat = {
      measureCount: measure,
      beatInMeasure: beatNumber,
      timestamp: audioContext.currentTime - startTime,
      hasPulse,
    };
    beat.countdown = countDownBeats.length ? true : false;
    beat.lastCountdown = countDownBeats.length === 1;
    setTimeout(function () {
      dispatch('beat', beat);
    }, Math.max(0, (time - audioContext.currentTime) * 1000));

    if (beatNumber % nthBeatSounded === 0 && countDownBeats.length) {
      countDownBeats.shift();
    }
  }

  export function play(upbeat, nthBeatSounded, timeNumerator) {
    isPlaying = true;
    // we want 8 "sounded" beats of countdown (although 2nd and 4th
    // should be silent).
    // That means the first measure we start from will be
    // (8 * nthBeatSounded) / timeNumerator * -1
    // If music has upbeat, we add 1 because the music "starts"
    // in the -1th measure, so it's one less to count down
    measureCount = ((8 * nthBeatSounded) / timeNumerator) * -1;
    countDownBeats = [true, false, true, false, true, true, true, true]; // 1, 2, 1, 2, 3, 4 ..
    measureCount += upbeat ? 1 : 0;
    nextBeatCounter = 0;
    startTime = audioContext.currentTime;
    nextBeatTime = audioContext.currentTime;
    scheduler();
    timerWorker.postMessage('start');
  }
  // This stop method does not dispatch any events upwards
  // We expect the caller to take care of stopping other things..
  export function stop() {
    isPlaying = false;
    nextBeatCounter = null;
    startTime = nextBeatTime = 0.0;
    timerWorker.postMessage('stop');
  }

  export function toggle() {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }

  // Repetition means jumping to specific measures,
  // either forward or back. The code keeping track of the
  // score needs to control measureCount for this.
  export function jumpToMeasure(newMeasure) {
    measureCount = newMeasure;
  }

  function makeBuffer(audioContext, hertz) {
    // audioContext.sampleRate is 44100 (samples per second)
    // divide 44100 by 50 gets us 882 - number of samples for 1/50th = 0,02 second
    var duration_frames = audioContext.sampleRate / 50;
    // createBuffer arguments noOfChannels, length (in number of samples), sampleRate
    let buffer = audioContext.createBuffer(
      1,
      duration_frames,
      audioContext.sampleRate
    );
    // array of numbers - sound data. 88200 0s at this point (two secs x 44100)
    var channel = buffer.getChannelData(0);
    for (let i = 0, phase = 0, amp = 0.5; i < duration_frames; i++) {
      channel[i] = Math.sin(phase) * amp;
      phase += (2 * Math.PI * hertz) / audioContext.sampleRate;
      if (phase > 2 * Math.PI) {
        phase -= 2 * Math.PI;
      }
      // volume drops to 0 during those 882 frames
      amp -= 0.5 / duration_frames;
    }
    return buffer;
  }
</script>
