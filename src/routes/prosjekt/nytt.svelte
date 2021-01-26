<script>
  import { stores, goto } from '@sapper/app';
  const { session } = stores();
  let bpm = 60;
  let bands = [];

  session.subscribe(data => {
    if (data.bands) {
      bands = data.bands;
    }
  });

let files;
let band;
// Good UX to pre-select band if only one
if (bands.length === 1) {
    band = bands[0]._id;
}
  let statusCode = "";
 
  async function handleSubmit() {
    if (files.length > 0) {
      const formData = new FormData();
      formData.append("band", band);
      formData.append("bpm", bpm);
      formData.append("file", files[0]);
      const response = await fetch("/api/projects", {
        method: "POST",
        body: formData
      });
      statusCode = response.status;
      if (statusCode === 200) {
          // redirect to /prosjekt/ID
          let projData = await response.json();
          goto('/prosjekt/' + projData._id);
      }
    }
  }
</script>

<h1>Nytt prosjekt</h1>

<p>Last opp fil i <em>Music XML</em>-format for å opprette et nytt prosjekt.</p>
{statusCode}
<form on:submit|preventDefault={handleSubmit}>
    <label for="band">Velg korps:</label>
    <select id="band" required bind:value={band}>
        <option></option>
        {#each bands as theBand}
            <option value={theBand._id}>{theBand.name}</option>
        {/each}
    </select>
    <br>
  <label for="file">Velg Music XML-fil:</label>
  <input required id="file" type="file" bind:files />
  <label for="file">Tempo: <input type="number" size="4" bind:value={bpm}>BPM</label>

  <input type="submit" value="Last opp" />
</form>