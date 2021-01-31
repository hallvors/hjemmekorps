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
    dispatch('dataupdate', {
      memberId: evt.detail._id,
      newMemberProps: { [activeTagName]: activeTagValue, band: {_ref: band._id }},
      bandId: band._id,
    });
    fetch('/api/members/' + evt.detail._id, {
      method: 'POST',
      credentials: 'same-origin',
      body: JSON.stringify({
        [activeTagName]: activeTagValue,
        bandId: band._id,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(result => {
      result.json().then(data =>
        dispatch('dataupdate', {
          memberId: evt.detail._id,
          newMemberProps: data,
          bandId: band._id,
        })
      );
    });
  }

  function getIconUrl(instrument) {
    return instrument ? `/images/instruments/${instrument}.png` : null;
  }
</script>

<ScrollableListToolsRight>
  <div>
    {#if members}
      <div class="members-list">
        {#each members as member}
          <div class="member">
            <DeltakerDisplay {member} on:click={memberClicked} />
          </div>
        {/each}
      </div>
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

<style>
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
</style>
