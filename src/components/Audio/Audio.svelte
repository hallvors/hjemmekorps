<script>
  export let recording;
  export let member;
  export let part;
  export let volume;
  export let registerAudioElement = () => {};
  let muted = false;
</script>

<div>
  {#if recording}Stemme <em>{part}</em>, musikant
    <em>{member.name}</em><br />
    <!--
    TODO: a way to detect and save volume. Maybe custom UI?
    <input type="range" name="volume" bind:value={volume} min="0" max="1" step="0.05" />
-->
    <!-- svelte-ignore a11y-media-has-caption -->
    <audio
      src={recording.url}
      use:registerAudioElement
      {muted}
      {volume}
      controls
    />
  {/if}
</div>

<style>
  audio {
    width: 100%;
  }
</style>
