<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  import DeltakerDisplay from '../DeltakerDisplay/DeltakerDisplay.svelte';
  import ProjectHome from './ProjectHome.svelte';
  import ScrollableListToolsRight from '../../structure/ScrollableListAndTools/ScrollableListToolsRight.svelte';
  import TagTrigger from '../TagTrigger/TagTrigger.svelte';

  export let project;
  export let band;
  let listOptions = [];
  let selectedOption = 1;

  // TODO: we're making it hard for Svelte to detect changes
  // because our data structures are getting a bit complex..
  // Some assignment hacks follow, would be nice to get rid of them..
  let projectAssignedMembers = [];
  function updateAssignedMembers() {
    let ids = [];
    project.partslist.forEach(item =>
      item.members.forEach(m => {
        let bm = band.members.find(bm => bm._id === m._ref);
        if (bm) {
          bm.part = item.part;
          ids.push(m._ref);
        }
      })
    );
    projectAssignedMembers = band.members.filter(m => ids.includes(m._id));
    if (listOptions[selectedOption]) {
      listOptions[selectedOption].list = listOptions[selectedOption].list;
    }
  }
  updateAssignedMembers();
  listOptions.push({
    title: 'Alle korpsmedlemmer',
    list: band.members,
  });
  listOptions.push({
    title: 'Med tildelte stemmer',
    list: projectAssignedMembers,
  });

  if (band.groups) {
    band.groups.forEach(group => {
      listOptions.push({
        title: group,
        list: band.members.filter(item => item.subgroup === group),
      });
    });
  }

  let activeTagValue, activeTagName;

  function memberClicked(evt) {
    if (!activeTagValue) {
      return;
    }
    let member = band.members.find(item => item._id === evt.detail._id);

    let partDetails = project.partslist.find(
      partDetails => partDetails.part === activeTagValue
    );
    let indexInList =
      partDetails.members &&
      partDetails.members.findIndex(member => {
        return member._ref === evt.detail._id;
      });

    if (indexInList > -1) {
      partDetails.members.splice(indexInList, 1);
      delete member.part;
    } else {
      if (!partDetails.members) {
        partDetails.members = [];
      }
      partDetails.members = [
        ...partDetails.members,
        {
          _ref: evt.detail._id,
          _type: 'reference',
          _key: 'hj' + parseInt(Math.random() * 1000000000000),
        },
      ];
    }
    updateAssignedMembers();
    fetch('/api/project/' + project._id, {
      method: 'POST',
      body: JSON.stringify(Object.assign({}, { partslist: project.partslist })),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(result => {
      result.json().then(data => {
        dispatch('dataupdate', data);
        updateAssignedMembers();
      });
    });
  }

  let audioElements = [];
  function startAudio() {
    audioElements.forEach(elm => elm.play());
  }
  function stopAudio() {
    audioElements.forEach(elm => elm.pause());
  }
</script>

<div class="project-main">
  <div class="project-info">
    <h1 class="h1-bigger project-title">{project.name}</h1>
  </div>
</div>

<ScrollableListToolsRight>
  <div>
    <h2>Musikanter</h2>
    <div class="list">
      <select bind:value={selectedOption}>
        {#each listOptions as list, index}
          <option value={index}>{list.title}</option>
        {/each}
      </select>
    </div>
    <div class="members-list">
      {#each listOptions[selectedOption].list || [] as member}
        <div class="member">
          <DeltakerDisplay
            {member}
            projectName={project.name}
            on:click={memberClicked}
            registerAudioElement={elm =>
              (audioElements = [...audioElements, elm])}
          />
        </div>
      {/each}
    </div>
  </div>
  <div slot="aside">
    <h3>Stemmer</h3>
    {#each project.partslist as partslist}
      <TagTrigger
        tagName="part"
        tagValue={partslist.part}
        active={activeTagValue === partslist.part}
        on:activate={evt => {
          activeTagValue = evt.detail.tagValue;
          activeTagName = evt.detail.tagName;
        }}
        on:deactivate={evt => (activeTagValue = null)}
      />
    {/each}
    {#if audioElements.length}
      <h3>Spill av opptak</h3>
      <button on:click={startAudio}>start</button><button on:click={stopAudio}
        >stop</button
      >
    {/if}
  </div>
</ScrollableListToolsRight>

{#if projectAssignedMembers.length}
  <p>
    For å dele <em>{project.name}</em>-noter med musikantene som har fått
    tildelt stemmer, gå til
    <a href="/prosjekt/{project._id}/liste">lenker til musikantenes sider</a>.
  </p>
{/if}

<h2>Noter</h2>
<ProjectHome {project} />

<style>
  :root {
    --padding-top: 30px;
  }

  .project-title {
    text-align: center;
    padding-bottom: 1em;
  }

  .list {
    text-align: center;
  }

  .members-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    width: 90%;
    margin-left: auto;
    margin-right: auto;
  }

  .member {
    flex: 0 1 auto;
    width: 45%;
    box-sizing: border-box;
  }

  h2 {
    text-align: center;
    padding-bottom: 1em;
    font-size: large;
  }

  /* .audio {

        border: 1px dashed lightcoral;
    } */

  /* .audio-controls {
        background-color: var(--dark);
        color: var(--light);
    } */
</style>
