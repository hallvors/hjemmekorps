<script>
  import ScrollableListToolsRight from '../../structure/ScrollableListAndTools/ScrollableListToolsRight.svelte';
  import RecordUI from '../RecordUI/RecordUI.svelte';
  import TagTrigger from '../TagTrigger/TagTrigger.svelte';
  import Loading from '../Loading/Loading.svelte';
  import LinkedBoxList from '../LinkedBoxList/LinkedBoxList.svelte';
  import { projectList, project, bands } from '../../lib/datastore';
  import TracksPlayer from '../TracksPlayer/TracksPlayer.svelte';
  // Dette får man fra backend
  // Beklager manglende samsvar mellom data-modellen for admin og musikant
  const band = $bands[0];
  export let user;
  let recordings = [];
  let message = 'Henter opptak...';
  console.log({project: $project, projectList: $projectList})
  if ($project?.generatedSoundfileUrl) {
    recordings.push({
      recording: {
        url: $project.generatedSoundfileUrl,
        meta: $project.soundMeta,
      },
    });
  }
  // still working on this feature, will be enabled later
  const ENABLE_LISTEN_WHILE_RECORDING = Boolean(recordings.length);

  if ($project?.partslist) {
    $project.partslist.forEach(part => {
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
</script>

<div class="main-wrapper">
  <div class="display">
    {#if user}
      {#if $projectList && $projectList.length}
      <h1>Dine låter</h1>
        <LinkedBoxList items={$projectList.map(proj => ({
          title: proj.name,
          href: `/ta-opp/${proj._id}`,
          orderbadge: proj.recordings.length ? 'Gjort!':'',
        }))}
        />
      {:else}
        <p>Det ser ut som dirigenten ikke har gitt deg noen låter å øve på enda.</p>
      {/if}
    {:else}
      <Loading {message} subMessage="Husk å bruke høretelefoner!" />
    {/if}
  </div>
</div>

