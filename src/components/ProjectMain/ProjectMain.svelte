<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  import DeltakerDisplay from '../DeltakerDisplay/DeltakerDisplay.svelte';
  import ScrollableListToolsRight from '../../structure/ScrollableListAndTools/ScrollableListToolsRight.svelte';
  import TagTrigger from '../TagTrigger/TagTrigger.svelte';
  import UsageHint from '../UsageHint/UsageHint.svelte';

  export let project;
  export let band;
  export let members = [];
  export let assignments = {};

  let listOptions = [];
  let selectedOption =
    assignments[project._id] && Object.keys(assignments[project._id]).length
      ? 1
      : 0;

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
</script>

<div class="project-main">
  <ScrollableListToolsRight>
    <main>
      <h2>Musikanter</h2>
      <UsageHint
        message="For å fordele stemmer, velg stemme til høyre og klikk på alle musikantene som skal spille den."
      />

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
                />
              </div>
            {/each}
          {/if}
        {/if}
      </div>
    </main>
    <div slot="aside">
      <h2>Tildel stemme</h2>
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
    </div>
  </ScrollableListToolsRight>
</div>

<style>
  :root {
    --padding-top: 30px;
  }

  main {
    width: 90%;
  }

  .list {
    text-align: center;
  }

  .members-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .member {
    flex: 0 1 auto;
    width: 48%;
    box-sizing: border-box;
  }

  h2 {
    text-align: center;
    padding-bottom: 1em;
    font-size: xlarge;
  }

  main h2 {
    padding-top: 3em;
  }
  main h2:first-child {
    padding-top: 0;
  }
</style>
