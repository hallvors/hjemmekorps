<script>
  import {
    bands,
    instruments,
    updateBands,
    selectedBand,
  } from '../../lib/datastore';
  import MemberImport from '../../components/MemberImport/MemberImport.svelte';
  function onUpdate(evt) {
    updateBands(
      Object.assign({}, $bands[$selectedBand], {
        members: evt.detail,
      })
    );
  }
</script>

<MemberImport
  band={$bands[$selectedBand]}
  {instruments}
  on:dataupdate={onUpdate}
/>
