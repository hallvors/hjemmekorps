<script>
  import { bands, updateBands, selectedBand } from '../../lib/datastore';
  import MemberImport from '../../components/MemberImport/MemberImport.svelte';
  function onUpdate(evt) {
    updateBands(
      Object.assign({}, $bands[$selectedBand], {
        members: evt.detail,
      })
    );
  }
</script>

<MemberImport band={$bands[$selectedBand]} on:dataupdate={onUpdate} />
