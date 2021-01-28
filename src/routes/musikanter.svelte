<script context="module">
  export async function preload(page, session) {
    const bands = session.bands;
    return {
      bands,
      instruments: session.instruments,
    };
  }
</script>

<script>
  import MemberList from '../components/MemberList/MemberList.svelte';
  // TODO: UI for selecting a different band?

  export let bands;
  export let instruments;

  let selectedBand = bands[0];

  function onUpdate(data) {
    data.detail.forEach(item => {
      let existing =
        selectedBand.members &&
        selectedBand.members.find(member => member.name === item.name);
      if (existing) {
        Object.assign(existing, item);
        selectedBand.members = [...selectedBand.members];
      } else {
        selectedBand.members = [...selectedBand.members, item];
      }
    });
  }
</script>

<svelte:head><title>Musikanter</title></svelte:head>

<h1>Musikanter</h1>
<p>Her er oversikten over musikanter. Bruk verktøyene for å tilordne gruppe og instrument. Mangler det noen? Gå til <a href="/musikanter/import">importer musikanter</a>.</p>
<MemberList
  members={selectedBand.members}
  band={selectedBand}
  instruments={instruments}
  on:dataupdate={onUpdate}
/>

{#if selectedBand.members.length}
<p>
  Når musikant-liste er komplett kan du <a href="/">gå videre til låter</a>.
</p>
{/if}
