<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  import DeltakerDisplay from '../DeltakerDisplay/DeltakerDisplay.svelte';
  import TagTrigger from '../TagTrigger/TagTrigger.svelte';

  export let members;
  export let band;
  export let instruments;
  export let icons;


  let activeTagValue, activeTagName;

  function memberClicked(evt) {
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
    let iconData = icons.find(item => item[instrument]);
    return iconData ? `/images/instruments/${iconData[instrument]}.png` : null;
  }
</script>

<div class="tagging-tools">
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

<div>
  {#if members}
    {#each members as member}
      <DeltakerDisplay {member} on:click={memberClicked} />
    {/each}
  {/if}
</div>

<p>
  <label
    ><input type="checkbox" bind:checked={showDataInput} />Vis boks for
    dataimport</label
  >
</p>

{#if showDataInput}
  <p>
    For å importere data, kopier en tabell fra et regneark og lim inn her.
    Musikantens navn må stå i første kolonne:
  </p>
  <textarea
    bind:value={importData}
    on:input={parseData}
    on:paste={parseData}
    on:blur={parseData}
  />
{/if}
{#if parsedImportData && parsedImportData.length}
  <p>
    Følgende telefonnumre og epost-adresser ble funnet. Alle som er valgt blir
    importert. Importerte numre og epost-adresser kan brukes til å sende ut
    innspillings-lenker.
  </p>
  <table>
    {#each parsedImportData as data}
      <tr>
        <td>
          <label
            ><input
              type="checkbox"
              value={data.name}
              checked
            />{data.name}</label
          >
        </td>
        <td>
          {#each data.phone as num}
            <label><input type="checkbox" value={num} checked />{num}</label>
          {/each}
        </td>
        <td>
          {#each data.email as mail}
            <label><input type="checkbox" value={mail} checked />{mail}</label>
          {/each}
        </td>
      </tr>
    {/each}
  </table>
  <button on:click={submitParsedData}>Importer valgte</button>
{/if}

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #bbb;
  }
  td {
    vertical-align: top;
    border: 1px solid #bbb;
    padding: 12px;
  }
  .tagging-tools {
    position: sticky;
  }
</style>
