<script context="module">
  export async function preload(page, session) {
    let id = page.params.id;
    return { id };
  }
</script>

<script>
  export let id;
  import Audio from '../../../components/Audio/Audio.svelte';
  import { projects, members, assignments } from '../../../lib/datastore';

  const project = $projects[id];

  let audioElements = [];
  function startAudio() {
    audioElements.forEach(elm => elm.play());
  }
  function stopAudio() {
    audioElements.forEach(elm => elm.pause());
  }
  function registerAudioElement(elm) {
    audioElements = [...audioElements, elm];
  }
</script>

{#each Object.entries($assignments[id]) as [memberId, data]}
  <Audio
    member={$members[memberId]}
    part={data.part}
    recording={data.recording}
    volume={(data.volume || 100) / 100}
    registerAudioElement={registerAudioElement}
  />
{/each}

<p><em>
    Du kan prøve å høre alle samtidig her, men det er usikkert om det vil høres fint ut..

  </em></p>
    <button on:click={startAudio}>start</button><button on:click={stopAudio}
    >stop</button
  >