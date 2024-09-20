<script context="module">
  export async function preload(page) {
    let id = page.params.id;
    return { id };
  }
</script>

<script>
  export let id;
  import { onMount } from 'svelte';

  import ScrollableListToolsRight from '../../../structure/ScrollableListAndTools/ScrollableListToolsRight.svelte';
  import RecordUI from '../../../components/RecordUI/RecordUI.svelte';
  import TagTrigger from '../../../components/TagTrigger/TagTrigger.svelte';
  import Loading from '../../../components/Loading/Loading.svelte';
  import { user, bands } from '../../../lib/datastore';
  import TracksPlayer from '../../../components/TracksPlayer/TracksPlayer.svelte';
  import Button from '../../../components/Button/Button.svelte';
  let recordings = [];
  let project;
  let message = 'Henter noter og opptak...';
  let activeRecordings = [];
  let ENABLE_LISTEN_WHILE_RECORDING;
  const band = $bands[0];
  // TODO: enable for older players only? Per-track basis?
  // Let members opt-out of having tracks plaid to others?
  const tracksPlayerEnabled = false;

  onMount(async function () {
    project = await (
      await fetch(`/api/project/${id}`, { credentials: 'same-origin' })
    ).json();
    console.log(project);
    if (project?.generatedSoundfileUrl) {
      recordings.push({
        recording: {
          url: project.generatedSoundfileUrl,
          meta: project.soundMeta,
        },
      });
    }
    // still working on this feature, will be enabled later
    ENABLE_LISTEN_WHILE_RECORDING = Boolean(recordings.length) && tracksPlayerEnabled;

    if (project && project.partslist) {
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
  });
  function handleClick(evt) {
    console.log(evt);
    if (activeRecordings.includes(evt.detail.tagValue)) {
      activeRecordings = activeRecordings.filter(
        url => url !== evt.detail.tagValue
      );
    } else {
      activeRecordings = [/*...activeRecordings,*/ evt.detail.tagValue];
    }
    console.log(activeRecordings);
  }
  let tracksPlayer;

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
  let rUI;
  function loadCustomHitNoteGame() {
    rUI.loadCustomHitNoteGame();
  }
</script>

<div class="main-wrapper">
  <div class="display">
    {#if project}
      <ScrollableListToolsRight>
        <RecordUI
          {project}
          user={$user}
          on:start={startPlay}
          on:stop={stopPlay}
          on:measuretime={evt => {
            if (tracksPlayer) tracksPlayer.jump(evt.detail.time);
          }}
          bind:this={rUI}
        />
        <div slot="aside">
          {#if ENABLE_LISTEN_WHILE_RECORDING && recordings && recordings.length}
            {#each recordings as rec}
              <TagTrigger
                tagRendered={rec.member ? rec.member.name : 'Alle'}
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
            <p>
              <em
                >Ingen stemmer spilt inn enda <i class="fas fa-music" /> - blir din
                den første?</em
              >
            </p>
          {/if}
        <p>
          Trenger du å øve litt ekstra?
        </p>
      <div>
        <Button onClick={loadCustomHitNoteGame} small={true}
          >Øv <b>disse</b> notene i Treff noten!</Button
        >
      </div>
        </div>
        {#if activeRecordings && activeRecordings.length && tracksPlayerEnabled}
          <TracksPlayer
            {recordings}
            {activeRecordings}
            bind:this={tracksPlayer}
            on:error={() => {
              activeRecordings.length = 0;
            }}
          />
        {/if}

      </ScrollableListToolsRight>
    {:else}
      <Loading {message} />
    {/if}
  </div>
</div>

<style>
  .main-wrapper {
    padding: 50px 0;
    padding-top: 10vw;
  }
</style>
