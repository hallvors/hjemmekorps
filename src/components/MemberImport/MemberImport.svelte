<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  import UsageHint from '../UsageHint/UsageHint.svelte';

  export let band;
  export let instruments;
  let importData = '';
  let parsedImportData;
  let existingToRemove = [];
  let importSuccess = false;

  function parseData() {
    if (importData) {
      let tmp = importData.split(/\r?\n/g);
      if (tmp.length > 1) {
        const isStyreportalenData = tmp[0].trim() === 'Medlemmer';
        parsedImportData = tmp
          .map((row, idx) => {
            let data = null;
            // Styreportalen list: two first rows headers
            if (isStyreportalenData && idx < 2) {
              return;
            }
            let rowData = row.trim().split(/[\t;]/g);
            if (rowData.length > 1) {
              data = {
                name: rowData[0],
                surname: isStyreportalenData ? rowData[1] : '',
                phone: [],
                email: [],
                subgroup: '',
              };
              for (let i = 1; i < rowData.length; i++) {
                if (/^[0-9 +]{8,}$/.test(rowData[i])) {
                  data.phone.push(rowData[i]);
                } else if (/@/.test(rowData[i])) {
                  data.email.push(rowData[i]);
                } else if (band.groups.includes(rowData[i])) {
                  data.subgroup = rowData[i];
                } else if (getInstrumentValueByTitle(rowData[i] || '')) {
                  data.instrument = getInstrumentValueByTitle(rowData[i] || '');
                }
              }
              return data;
            }
          })
          .filter(Boolean);
        parsedImportData.forEach(entry => {
          const name = isStyreportalenData
            ? [entry.name, entry.surname].join(' ')
            : entry.name;
          entry.fullname = name;
          const existing = band.members.find(
            member =>
              member.name === name ||
              (member.name === entry.name &&
                member.surname === entry.surname) ||
              // handle cases where we wanted to split first- and surname differently
              `${entry?.name} ${entry?.surname}` ===
                `${member.name} ${member.surname}`
          );
          if (existing) {
            // TODO: conside a more complex algorithm if there's older
            // data we want to keep? But it might be too unpredictable..
            Object.assign(entry, { _id: existing._id });
          }
        });

        if (band && band.members) {
          existingToRemove = band.members.filter(existing => {
            return !parsedImportData.find(
              entry =>
                entry.fullname === existing.name ||
                (entry.name === existing.name &&
                  entry.surname === existing.surname) ||
                // handle cases where we wanted to split first- and surname differently
                `${entry.name} ${entry.surname}` ===
                  `${existing.name} ${existing.surname}`
            );
          });
        }
      }
    }
  }
  function getByName(name) {
    return document.querySelector('input[value="' + name + '"]');
  }
  function getInstrumentValueByTitle(title) {
    if (!title) {
      return null;
    }
    // Split to handle input like "Kornett/trompet"
    let titlesFromImport = title.toLowerCase().split(/\//g);
    const instrument = instruments.find(
      item =>
        titlesFromImport.includes(item.title.toLowerCase()) ||
        titlesFromImport.includes(item.value) || // Styreportalen spells Baryton in English..
        // we allow "Saksofon" to match i.e. "Sopransaxofon" here:
        titlesFromImport.find(importTitle =>
          item.title.includes(importTitle.replace('saksofon', 'saxofon'))
        )
    );
    if (instrument) {
      return instrument.value;
    }
  }

  function submitParsedData() {
    const submitData = parsedImportData.filter(item => {
      if (getByName(item.fullname).checked) {
        item.phone = item.phone.filter(num => getByName(num).checked);
        item.email = item.email.filter(mail => getByName(mail).checked);
        return true;
      }
      return false;
    });
    const deactivate = [].map
      .call(document.getElementsByName('remove'), item =>
        item.checked ? item.value : null
      )
      .filter(Boolean);

    fetch('/api/members', {
      method: 'POST',
      credentials: 'same-origin',
      body: JSON.stringify({
        members: submitData,
        bandId: band._id,
        deactivate,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(response => {
      let statusCode = response.status;
      if (statusCode === 200) {
        importData = '';
        parsedImportData = null;
        importSuccess = true;
        response.json().then(data => dispatch('dataupdate', data));
      }
    });
  }
</script>

<svelte:head><title>Importer musikanter - hjemmekorps.no</title></svelte:head>

{#if importSuccess}
  <p>
    Import fullført. <a href="/musikanter?reload={Math.random()}"
      >Til musikantliste</a
    >
  </p>
{:else}
  <UsageHint
    message="For å importere data, kopier en tabell fra et regneark og lim inn her.
    Musikantens navn må stå i første kolonne. Tips: bare kopier alle data med Ctrl-A
    og Ctrl-C, importen velger ut det som ser ut som nyttig informasjon."
    textAlign="left"
  />
  <textarea
    bind:value={importData}
    on:input={parseData}
    on:paste={parseData}
    on:blur={parseData}
  />

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
            <span class="flagme">
              {#if data._id}Oppdater!{:else}Ny!{/if}
            </span>
            <label
              ><input type="checkbox" value={data.fullname} checked />
              {data.fullname}</label
            >
          </td>
          <td>{data.subgroup}</td>
          <td
            >{#if data.instrument}<img
                width="40"
                src={`/images/instruments/${data.instrument}.png`}
                alt={data.instrument}
              />{/if}</td
          >
          <td>
            {#each data.phone as num}
              <label><input type="checkbox" value={num} checked /> {num}</label>
            {/each}
          </td>
          <td>
            {#each data.email as mail}
              <label
                ><input type="checkbox" value={mail} checked /> {mail}</label
              >
            {/each}
          </td>
        </tr>
      {/each}
    </table>
    {#if existingToRemove && existingToRemove.length}
      <p>
        Det ligger inne medlemmer som ikke er på den nye lista som blir
        importer. Kryss av dersom de skal fjernes / deaktiveres.
      </p>
      <table>
        <tr><th>Navn</th><th>Gruppe</th></tr>
        {#each existingToRemove as existing}
          <tr>
            <td
              ><label
                >Fjern <b>{[existing.name, existing.surname].join(' ')}</b>
                <input
                  type="checkbox"
                  name="remove"
                  value={existing._id}
                /></label
              ></td
            >
            <td>{existing.subgroup || ''}</td>
          </tr>
        {/each}
      </table>
    {/if}
    <button on:click={submitParsedData}>Importer og oppdater medlemmene</button>
  {/if}
{/if}

<style>
  textarea {
    width: 100%;
    height: 200px;
  }
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
  .flagme {
    background: yellow;
    transform: rotate(20deg);
    float: right;
  }
</style>
