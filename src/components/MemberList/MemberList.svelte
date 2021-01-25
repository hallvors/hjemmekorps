<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  import DeltakerDisplay from '../DeltakerDisplay/DeltakerDisplay.svelte';
  import TagTrigger from '../TagTrigger/TagTrigger.svelte';
  import ScrollableListToolsRight from '../../structure/ScrollableListAndTools/ScrollableListToolsRight.svelte';

  export let members;
  export let band;
  export let instruments;


  let activeTagValue, activeTagName;

  function memberClicked(evt) {
    if (!activeTagValue) return;
    let member = members.find(item => item._id === evt.detail._id);
    dispatch('dataupdate', [
      Object.assign(member, { [activeTagName]: activeTagValue }),
    ]);
    fetch('/api/members/' + evt.detail._id, {
      method: 'POST',
      body: JSON.stringify({
        [activeTagName]: activeTagValue,
        bandId: band.id,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(result => {
      result.json().then(data => dispatch('dataupdate', [data]));
    });
  }

  function getIconUrl(instrument) {
    return instrument ? `/images/instruments/${instrument}.png` : null;
  }
</script>

<ScrollableListToolsRight>
  <div>
    {#if members}
      {#each members as member}
        <DeltakerDisplay {member} on:click={memberClicked} />
      {/each}
    {/if}
  </div>

  <div class="tagging-tools" slot="aside">
    <h3>Grupper</h3>
    {#each band.groups as subgroup}
      <TagTrigger
        tagName="subgroup"
        tagValue={subgroup}
        active={activeTagValue === subgroup}
        on:activate={evt => {
          activeTagValue = evt.detail.tagValue;
          activeTagName = evt.detail.tagName;
        }}
        on:deactivate={evt => (activeTagValue = null)}
      />
    {/each}
    <h3>Instrumenter</h3>
    {#each instruments as instrument}
      <TagTrigger
        tagName="instrument"
        tagValue={instrument.value}
        tagRendered={instrument.title}
        tagIcon={getIconUrl(instrument.value)}
        active={activeTagValue === instrument.value}
        on:activate={evt => {
          activeTagValue = evt.detail.tagValue;
          activeTagName = evt.detail.tagName;
        }}
        on:deactivate={evt => (activeTagValue = null)}
      />
    {/each}
  </div>
</ScrollableListToolsRight>
