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
  listOptions.push({
    title: 'Alle korpsmedlemmer',
    list: band.members,
  });
  listOptions.push({
    title: 'Med stemmer',
    list: project.members,
  });
  if (band.groups) {
    band.groups.forEach(group => {
      listOptions.push({
        title: group,
        list: band.members.filter(item => item.subgroup === group),
      });
    });
  }
  let selectedOption = 1;

  let activeTagValue, activeTagName;

  function memberClicked(evt) {
    if (!activeTagValue) {
      return;
    }
    let member = band.members.find(item => item._id === evt.detail._id);
    member.part = activeTagValue;
    if (!project.members) {
      project.members = [];
    }
    project.members = [...project.members, member];
    
    let partDetails = project.partslist.find(
      partDetails => partDetails.part === activeTagValue
    );
    let exists =
      (partDetails.members &&
        partDetails.members.findIndex(member => {
          member._ref === evt.detail._id;
        }));

    if (exists > -1) {
      partDetails.members.splice(exists, 1);
    } else {
      if (!partDetails.members) {
        partDetails.members = [];
      }
      partDetails.members = [
        ...partDetails.members,
        {
          _ref: evt.detail._id,
          _type: 'reference',
          _key: parseInt(Math.random() * 1000000000000),
        },
      ];
    }

    dispatch('dataupdate', project);
    fetch('/api/project/' + project._id, {
      method: 'POST',
      body: JSON.stringify(Object.assign({}, { partslist: project.partslist })),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(result => {
      result.json().then(data => dispatch('dataupdate', data));
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

<main>
  <div class="col">
    <div class="members">
      <h1 class="members-title">Musikanter</h1>

      <select bind:value={selectedOption}>
        {#each listOptions as list, index}
          <option value={index}>{list.title}</option>
        {/each}
      </select>

      {#each listOptions[selectedOption].list || [] as member}
        <DeltakerDisplay
          {member}
          on:click={memberClicked}
          registerAudioElement={elm =>
            (audioElements = [...audioElements, elm])}
        />
      {/each}

    </div>
  </div>
  <div class="col main">
    <ScrollableListToolsRight>
      <ProjectHome {project} />
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
          <button on:click={startAudio}>start</button><button
            on:click={stopAudio}>stop</button
          >
        {/if}
        <p>
          <a href="/prosjekt/{project._id}/liste"
            >Lenker til musikantenes sider</a
          >
        </p>
      </div>
    </ScrollableListToolsRight>
  </div>
</main>

<style>
  :root {
    --padding-top: 30px;
    --members-width: 54%;
  }

  main {
    display: flex;
  }

  main > div.col {
    flex: 1;
  }

  main > div.col.main {
    flex: 1;
    flex-basis: 50%;
  }

  .members {
    /* 
    border-right: var(--border);
    */
    padding: calc(var(--padding-top) + 10px) 0 20px 0;

    width: var(--members-width);
  }

  .members-title {
    text-align: center;
    margin: 0;
    padding: 0;
  }

  /* || CSS for possible lines between stuff */

  /* .member-line {
        height: 20%;
        width: 8%;

        position: absolute;
        left: calc(var(--members-width) - 21px);
        top: 300px;
        border: var(--border);
    } */

  /* || Project-main */

  .project-main {
    padding-top: var(--padding-top);
    width: 66%;
  }

  .project-title {
    margin: 0;
    padding: 0;
  }

  .project-info {
    width: 85%;
    margin: auto;
  }

  /* .audio {

        border: 1px dashed lightcoral;
    } */

  /* .audio-controls {
        background-color: var(--dark);
        color: var(--light);
    } */
</style>
