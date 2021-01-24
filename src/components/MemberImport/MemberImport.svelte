<script>
  export let band;
  let importData = '';
  let parsedImportData;
  let importSuccess = false;

  function parseData() {
    if (importData) {
      let tmp = importData.split(/\r?\n/g);
      if (tmp.length) {
        parsedImportData = tmp
          .map(row => {
            let rowData = row.split(/[\t;]/g);
            let data;
            if (rowData.length) {
              data = { name: rowData[0], phone: [], email: [] };
              for (let i = 1; i < rowData.length; i++) {
                if (/^[0-9 +]{8,}$/.test(rowData[i])) {
                  data.phone.push(rowData[i]);
                } else if (/@/.test(rowData[i])) {
                  data.email.push(rowData[i]);
                }
              }
            }
            return data;
          })
          .filter(row => row);
      }
    }
  }
  function getByName(name) {
    return document.querySelector('input[value="' + name + '"]');
  }
  function submitParsedData() {
    let submitData = parsedImportData.filter(item => {
      if (getByName(item.name).checked) {
        item.phone = item.phone.filter(num => getByName(num).checked);
        item.email = item.email.filter(mail => getByName(mail).checked);
        return true;
      }
      return false;
    });
    fetch('/api/members', {
      method: 'POST',
      body: JSON.stringify({ members: submitData, bandId: band._id }),
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
        //response.json().then(data => dispatch('dataupdate', data));
      }
    });
  }
</script>

{#if importSuccess}
  <p>Import fullført. <a href="/musikanter">Til musikantliste</a></p>
{:else}
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
              <label><input type="checkbox" value={mail} checked />{mail}</label
              >
            {/each}
          </td>
        </tr>
      {/each}
    </table>
    <button on:click={submitParsedData}>Importer valgte</button>
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
</style>
