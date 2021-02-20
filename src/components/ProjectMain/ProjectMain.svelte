<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  import DeltakerDisplay from '../DeltakerDisplay/DeltakerDisplay.svelte';
  import ProjectPartsLinks from './ProjectPartsLinks.svelte';
  import ScrollableListToolsRight from '../../structure/ScrollableListAndTools/ScrollableListToolsRight.svelte';
  import TagTrigger from '../TagTrigger/TagTrigger.svelte';
  import LinkedBox from '../LinkedBox/LinkedBox.svelte';

  export let project;
  export let band;
  export let members = [];
  export let assignments = {};

  let listOptions = [];
  let selectedOption = Object.keys(assignments).length ? 1 : 0;

  // filter out members from other bands, list members in alphabetical order
  let membersFiltered = Object.keys(members)
    .filter(m => m && members[m].band._ref === band._id)
    .map(m => members[m])
    .sort((mA, mB) => {
      return mA.name < mB.name ? -1 : 1;
    });

  listOptions.push({
    title: 'Alle korpsmedlemmer',
    list: membersFiltered,
  });
  listOptions.push({
    title: 'Med tildelte stemmer',
  });

  if (band.groups) {
    band.groups.forEach(group => {
      listOptions.push({
        title: group,
        list: membersFiltered.filter(item => item.subgroup === group),
      });
    });
  }

  let activeTagValue, activeTagName;

  function memberClicked(evt) {
    if (!activeTagValue) {
      return;
    }
    let partDetails = project.partslist.find(
      partDetails => partDetails.part === activeTagValue
    );
    let indexInList =
      partDetails.members &&
      partDetails.members.findIndex(memRef => {
        return memRef._ref === evt.detail._id;
      });

    if (indexInList > -1) {
      partDetails.members.splice(indexInList, 1);
    } else {
      if (!partDetails.members) {
        partDetails.members = [];
      }
      partDetails.members.push({
        _ref: evt.detail._id,
        _type: 'reference',
        _key: 'hj' + parseInt(Math.random() * 1000000000000),
      });
    }
    partDetails.members = [...partDetails.members];

    dispatch('partsupdate', {
      id: project._id,
      partslist: [...project.partslist],
    });
    fetch('/api/project/' + project._id, {
      method: 'POST',
      body: JSON.stringify({
        partslist: project.partslist.map(part => ({
          _key: part._key,
          _type: part._type,
          _ref: part._ref,
          part: part.part,
          sheetmusic: part.sheetmusic,
          members: part.members.map(m => ({
            // TODO: no token, recording - we get that back from the server,
            // but temporarily they will be missing during the update. Can we fix?
            _key: m._key,
            _ref: m._ref,
            _type: m._type,
          })),
        })),
      }),
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(result => {
      result.json().then(data => {
        dispatch('dataupdate', data);
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
      {#if listOptions[selectedOption].list}
        {#each listOptions[selectedOption].list || [] as member}
          <div class="member">
            <DeltakerDisplay
              member={members[member._id]}
              projectName={project.name}
              assignmentInfo={(assignments[project._id] || {})[member._id]}
              on:click={memberClicked}
              registerAudioElement={elm =>
                (audioElements = [...audioElements, elm])}
            />
          </div>
        {/each}
      {:else}
        <!-- render based on parts list -->
        {#if assignments && assignments[project._id]}
          {#each Object.entries(assignments[project._id]) as [memberId, data]}
            <div class="member">
              <DeltakerDisplay
                member={members[memberId]}
                projectName={project.name}
                assignmentInfo={data}
                on:click={memberClicked}
                registerAudioElement={elm =>
                  (audioElements = [...audioElements, elm])}
              />
            </div>
          {/each}
        {/if}
      {/if}
    </div>
    {#if assignments && assignments[project._id] && Object.keys(assignments[project._id]).length}
      <div class="send">
        <LinkedBox href="/prosjekt/{project._id}/send">
          <p class="send-button">
            <i class="fa fa-paper-plane" aria-hidden="true" />
            Send noter
          </p>
        </LinkedBox>
      </div>
    {/if}
  </div>
  <div slot="aside">
    <h2>Stemmer</h2>
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
      <h2>Spill av opptak</h2>
      <p><a href="/prosjekt/{project._id}/opptak">Liste over opptak</a></p>
      <p>
        <em>
          Du kan prøve å høre alle samtidig her, men det er usikkert om det vil
          høres fint ut..
        </em>
      </p>
      <button on:click={startAudio}>start</button><button on:click={stopAudio}
        >stop</button
      >
    {/if}
  </div>
</ScrollableListToolsRight>

<h2>Noter</h2>
<ProjectPartsLinks {project} />

<style>
  :root {
    --padding-top: 30px;
  }

  .project-title {
    text-align: center;
    padding-bottom: 0.8em;
    padding-top: 0.8em;
    margin: 0;
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
    font-size: xlarge;
  }

  .send {
    width: 85%;
    margin-left: auto;
    margin-right: auto;
  }

  .send-button {
    padding: 1em;
  }

  /* .audio {

        border: 1px dashed lightcoral;
    } */

  /* .audio-controls {
        background-color: var(--dark);
        color: var(--light);
    } */
</style>
