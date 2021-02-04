<script>
  import ScrollableListToolsRight from '../../structure/ScrollableListAndTools/ScrollableListToolsRight.svelte';
  import RecordUI from '../RecordUI/RecordUI.svelte';
  import TagTrigger from '../TagTrigger/TagTrigger.svelte';
  import Loading from '../Loading/Loading.svelte';
  import {projectList, bands} from '../../lib/datastore'
  // Dette får man fra backend
  // Beklager manglende samsvar mellom data-modellen for admin og musikant
  const project = $projectList[0];
  const band = $bands[0];
  export let user;
  let recordings = [];
  if (project.partslist) {

  project.partslist.forEach(part => {
    if (part.members) {
      part.members.forEach(memRef => {
        if (memRef.recording) {
          let member = band.members.find(m => m._id === memRef._ref);
          recordings.push({recording: memRef.recording, member});
        }
      });
    }
  });
  }
  let activeRecordings = [];
  function handleClick(evt) {
    if (activeRecordings.includes(evt.detail.tagName)) {
      activeRecordings = activeRecordings.filter(url => url !==evt.detail.tagName);
    } else {
      activeRecordings = [...activeRecordings, evt.detail.tagName]
    }
    console.log(activeRecordings)
  }

function startPlay(){
  for(let elms = document.getElementsByTagName('audio'), elm, i; elm = elms[i]; i++){
    elm.play()
  }
}

function stopPlay(){
  for(let elms = document.getElementsByTagName('audio'), elm, i; elm = elms[i]; i++){
    elm.stop()
  }
}

</script>

<div class="main-wrapper">
  <div class="display">
    {#if project && user}
      <ScrollableListToolsRight>
        <RecordUI {project} {user} on:start={startPlay} on:stop={stopPlay} />
        <div slot="aside">
        {#if recordings && recordings.length}
          {#each recordings as rec}
            <TagTrigger
              tagValue={rec.member.name}
              tagName={rec.recording.url}
              active={activeRecordings.includes(rec.recording.url)}
              on:activate={handleClick}
              on:deactivate={handleClick}
            />
          {/each}
        {/if}
        </div>
        {#each activeRecordings as rec}
          <audio src={rec} controls />
        {/each}
      </ScrollableListToolsRight>
    {:else}
       <Loading />
    {/if}
  </div>
</div>

<style>
  .main-wrapper {
    padding: 50px 0;
    width: 90%;
    margin: 0 auto;
  }

</style>
