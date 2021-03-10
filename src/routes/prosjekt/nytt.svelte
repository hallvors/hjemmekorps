<script>
  import { goto } from '@sapper/app';
  import {
    bands,
    selectedBand,
    addProject,
    updateProjectList,
  } from '../../lib/datastore';
  import Loading from '../../components/Loading/Loading.svelte';

  let bpm = 96;
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
      formData.append('bpm', bpm);
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

<p>Last opp fil i <em>Music XML</em>-format for å opprette et nytt prosjekt.</p>
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

  <label
    >Tempo (om ikke oppgitt i notene): kvartnote = <input
      type="number"
      size="4"
      bind:value={bpm}
    />BPM</label
  >

  <input type="submit" value="Last opp" />
</form>

{#if loading}
<Loading message="Laster opp.." />
{/if}
