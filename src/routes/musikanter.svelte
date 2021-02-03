<script>
  import MemberList from '../components/MemberList/MemberList.svelte';
  // TODO: UI for selecting a different band?

  import {
    bands,
    instruments,
    updateMember,
    selectedBand,
  } from '../lib/datastore';

  function onUpdate(evt) {
    // newMemberProps: could be .subgroup or .instrument changed
    updateMember(
      evt.detail.bandId,
      evt.detail.memberId,
      evt.detail.newMemberProps
    );
  }
</script>

<svelte:head><title>Musikanter</title></svelte:head>

<h1>Musikanter</h1>
<p>
  Her er oversikten over musikanter. Bruk verktøyene for å tilordne gruppe og
  instrument. Mangler det noen? Gå til <a href="/musikanter/import"
    >importer musikanter</a
  >.
</p>
<MemberList
  members={$bands[$selectedBand].members}
  band={$bands[$selectedBand]}
  instruments={$instruments}
  on:dataupdate={onUpdate}
/>

{#if $bands[$selectedBand].members.length}
  <p>
    Når musikant-liste er komplett kan du <a href="/prosjekt">gå videre til låter</a>.
  </p>
{/if}
