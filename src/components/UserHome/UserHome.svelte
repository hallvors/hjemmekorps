<script>
  import ScrollableListToolsRight from '../../structure/ScrollableListAndTools/ScrollableListToolsRight.svelte';
  import RecordUI from '../RecordUI/RecordUI.svelte';
  import TagTrigger from '../TagTrigger/TagTrigger.svelte';
  import Loading from '../Loading/Loading.svelte';
  import { projectList, bands } from '../../lib/datastore';
  import TracksPlayer from '../TracksPlayer/TracksPlayer.svelte';
  // Dette får man fra backend
  // Beklager manglende samsvar mellom data-modellen for admin og musikant
  const project = $projectList[0];
  const band = $bands[0];

  // still working on this feature, will be enabled later
  const ENABLE_LISTEN_WHILE_RECORDING = false;

  export let user;
  let recordings = [];
  if (project.partslist) {
    project.partslist.forEach(part => {
      if (part.members) {
        part.members.forEach(memRef => {
          if (memRef.recording) {
            let member = band.members.find(m => m._id === memRef._ref);
            recordings.push({ recording: memRef.recording, member });
          }
        });
      }
    });
  }
  let activeRecordings = [];
  function handleClick(evt) {
    console.log(evt);
    if (activeRecordings.includes(evt.detail.tagValue)) {
      activeRecordings = activeRecordings.filter(
        url => url !== evt.detail.tagValue
      );
    } else {
      activeRecordings = [...activeRecordings, evt.detail.tagValue];
    }
    console.log(activeRecordings);
  }
  let tracksPlayer;
  let loading = false;
  function indicateLoading() {
    loading = true;
  }
  function stopIndicateLoading() {
    loading = false;
  }
  function startPlay() {
    if (tracksPlayer) {
      tracksPlayer.start();
    }
  }
  function stopPlay() {
    if (tracksPlayer) {
      tracksPlayer.stop();
    }
  }
</script>

<div class="main-wrapper" class:loading>
  <div class="display">
    {#if project && user}
      <ScrollableListToolsRight>
        <RecordUI {project} {user} on:start={startPlay} on:stop={stopPlay} />
        <div slot="aside">
          {#if ENABLE_LISTEN_WHILE_RECORDING && recordings && recordings.length}
            {#each recordings as rec}
              <TagTrigger
                tagRendered={rec.member ? rec.member.name : 'opptak'}
                tagName=""
                tagValue={rec.recording.url}
                active={activeRecordings.includes(rec.recording.url)}
                className="fa-volume-mute"
                classNameActive="fa-volume-up"
                on:activate={handleClick}
                on:deactivate={handleClick}
              />
            {/each}
            {:else}
            <p><em>Ingen stemmer spilt inn enda <i class="fas fa-music"></i> - blir din den første?</em></p>
          {/if}
        </div>
        {#if activeRecordings && activeRecordings.length}
          <TracksPlayer
            recordings={activeRecordings}
            bind:this={tracksPlayer}
            on:loadstart={indicateLoading}
            on:loadend={stopIndicateLoading}
          />
        {/if}
      </ScrollableListToolsRight>
    {:else}
      <Loading message="Henter noter og opptak..." />
    {/if}
  </div>
</div>

<style>
  .main-wrapper {
    padding: 50px 0;
    padding-top: 10vw;
  }
  .main-wrapper.loading {
    cursor: wait;
  }
</style>
