<script context="module">
  export async function preload(page) {
    let id = page.query.id;
    return { id };
  }
</script>

<script>
  import { goto } from '@sapper/app';
  import {
    bands,
    selectedBand,
    addProject,
    updateProjectList,
  } from '../../lib/datastore';
  import Loading from '../../components/Loading/Loading.svelte';
  import UsageHint from '../../components/UsageHint/UsageHint.svelte';
  import SaveAsMusicXML from '../../components/HowTo/SaveAsMusicXML.svelte';

  export let id;
  let loading = false;

  let files;
  let band = $bands[$selectedBand]._id;
  let statusCode = '';

  async function handleSubmit(event) {
    if (!event.target.checkValidity()) {
      return;
    }
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('band', band);
      if (id) {
        formData.append('projectId', id);
      }
      formData.append('file', files[0]);
      loading = true;
      const response = await fetch('/api/projects', {
        method: 'POST',
        body: formData,
      });
      statusCode = response.status;
      loading = false;
      if (statusCode === 200) {
        // redirect to /prosjekt/ID
        let projData = await response.json();
        addProject(projData);
        updateProjectList({ _id: projData._id, title: projData.title });
        goto('/prosjekt/' + projData._id);
      } else {
        alert('Opplasting lyktes muligens ikke - feilkode ' + statusCode);
      }
    }
  }
</script>

<h1>Nytt prosjekt</h1>

<p>Last opp fil i <em>Music XML</em>-format for å opprette et nytt prosjekt.
Se under for hvordan du kan lagre MusicXML-filer med Musescore.</p>
{statusCode}
<form on:submit|preventDefault={handleSubmit}>
  {#if bands.length > 1}
    <label for="band">Velg korps:</label>
    <select id="band" required bind:value={band}>
      <option />
      {#each bands as theBand}
        <option value={theBand._id}>{theBand.name}</option>
      {/each}
    </select>
    <br />
  {:else}
    <input type="hidden" name="band" bind:value={band} />
  {/if}
  <label for="file">Velg Music XML-fil:</label>
  <input required id="file" type="file" bind:files />
  <input type="submit" value="Last opp" />
</form>

<UsageHint
  message="Tips: last opp hele dirigent-partituret som en Music XML-fil. Du trenger ikke laste opp hver enkelt stemme separat."
/>

<SaveAsMusicXML />

{#if loading}
  <Loading message="Laster opp.." />
{/if}
