<script>
  import { createEventDispatcher } from 'svelte';
  import Loading from '../Loading/Loading.svelte';
  import {soundBuffers} from '../../lib/datastore';

  const dispatch = createEventDispatcher();
  export let recordings = []; // [url, url]
  let buffers = [];
  let audioContext;
  let mix;
  $: preparedRecordings = init(recordings);
  let loading = false;

  async function init(recordings) {
    if (recordings.length === 0 || typeof window === 'undefined') {
      return;
    }
    loading = true;
    console.log('start init, fetching ' + recordings.length);
    audioContext =
      audioContext || new (window.AudioContext || window.webkitAudioContext)();
    buffers = await Promise.all(
      recordings.map(url => {
        if ($soundBuffers[url]) {
          return Promise.resolve($soundBuffers[url]);
        }
        return Promise.resolve(
          fetch(url).then(res =>
            res
              .arrayBuffer()
              .then(buffer => audioContext.decodeAudioData(buffer))
          )
        );
      })
    );
    recordings.forEach((url, idx) => {
      soundBuffers.update(data => {
        return {...data, [url]: buffers[idx]}
      });
    });

    let songLength = 0;
    for (let track of buffers) {
      if (track.length > songLength) {
        songLength = track.length;
      }
    }
    console.log('pre-mix, songlength ' + songLength);
    mix = audioContext.createBufferSource();
    //call our function here
    if (recordings.length > 1) {
      mix.buffer = mixDown(buffers, songLength, 2);
    } else {
      mix.buffer = buffers[0];
    }
    console.log('post-mix, ready!');
    mix.connect(audioContext.destination);
    loading = false;
    return buffers;
  }

  export function start() {
    //will playback the entire mix
    if (mix) {
      mix.start();
    }
  }
  export function stop() {
    try {
      mix.stop();
    } catch (e) {
      console.error(e); // 'not started' state will throw
    }
  }

  // https://stackoverflow.com/questions/57155167/web-audio-api-playing-synchronized-sounds

  function mixDown(bufferList, totalLength, numberOfChannels = 2) {
    //create a buffer using the totalLength and sampleRate of the first buffer node
    let finalMix = audioContext.createBuffer(
      numberOfChannels,
      totalLength,
      bufferList[0].sampleRate
    );

    //first loop for buffer list
    for (let i = 0; i < bufferList.length; i++) {
      // second loop for each channel ie. left and right
      for (let channel = 0; channel < numberOfChannels; channel++) {
        //here we get a reference to the final mix buffer data
        let buffer = finalMix.getChannelData(channel);

        //last is loop for updating/summing the track buffer with the final mix buffer
        for (let j = 0; j < bufferList[i].length; j++) {
          buffer[j] += bufferList[i].getChannelData(channel)[j];
        }
      }
    }

    return finalMix;
  }
</script>

{#if loading}
  <Loading message="Henter opptak.." subMessage="Husk å bruke høretelefoner!" />
{/if}
