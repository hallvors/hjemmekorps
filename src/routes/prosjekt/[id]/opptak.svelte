<script context="module">
  export async function preload(page, session) {
    let id = page.params.id;
    return { id };
  }
</script>

<script>
  export let id;
  import Audio from '../../../components/Audio/Audio.svelte';
  import UsageHint from '../../../components/UsageHint/UsageHint.svelte';
  import Back from '../../../components/Back/Back.svelte';

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

  let timeouts = {};
  function planSavingVolumeFunc(recording) {
    return function (event) {
      if (timeouts[recording._id]) {
        clearTimeout(timeouts[recording._id]);
        delete timeouts[recording._id];
      }
      let volume = event.target.volume * 100;
      timeouts[recording._id] = setTimeout(function () {
        fetch(`/api/recording/${recording._id}/volume`, {
          method: 'POST',
          body: `volume=` + volume,
          headers: { 'Content-type': 'application/x-www-form-urlencoded' },
        });
      }, 750);
    };
  }

  function recombine() {
    fetch(`/api/project/${id}/recombine-recordings`, {
      method: 'POST',
    })
    .then(() =>{
      alert('Nytt samla lydspor lages nå.')
    });
  }
</script>

<svelte:head
  ><title>{$projects[id].name} : Opptak - hjemmekorps.no</title></svelte:head
>

<h2>Opptak</h2>

{#if project.generated_soundfile}
  <div class="merged-audio">
    <h3>Samlet lydfil</h3>
    <UsageHint
      message="Alle opptak har blitt lagt inn i ei lydfil. Dette skjer automatisk, og et godt resultat kan ikke garanteres."
    />
    <span class="audio">
      <!-- svelte-ignore a11y-media-has-caption -->
      <!-- We can not create captions for user-generated music files :) -->
      <audio controls src={project.generated_soundfile.url}>
        Audio does not work
      </audio>
    </span>
  </div>
{/if}

{#if Object.entries($assignments[id]).length}
  <h3>Innsendte opptak</h3>
  <UsageHint
    message="Her er alle opptak sendt inn så langt. Volumet du setter her brukes neste gang felles lydspor lages. Dersom et opptak ikke skal tas med i generert fil, kan volumet settes til null."
  />
  {#each Object.entries($assignments[id]) as [memberId, data]}
    <Audio
      member={$members[memberId]}
      part={data.part}
      recording={data.recording}
      {registerAudioElement}
      volumeChangeHandler={planSavingVolumeFunc(data.recording)}
    />
  {/each}

  <p>
    <em>
      Du kan prøve å høre alle samtidig her, men det er usikkert om det vil
      høres fint ut..
    </em>
  </p>
  <button on:click={startAudio}>start</button>
  <button on:click={stopAudio}>stopp</button>
  <button on:click={recombine}>Lag ny samla fil</button>

{:else}
  <p>Her er det visst ikke spilt inn noe enda.</p>
{/if}

<p>
  <Back {id} />
</p>

<style>
  h2,
  h3 {
    text-align: center;
  }
  audio {
    width: 100%;
  }
</style>
