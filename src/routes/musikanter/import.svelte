<script context="module">
    export async function preload(page, session) {
      const bands = session.bands;
      return {
        bands,
      };
    }
  </script>
  
<script>
    export let bands;
    import MemberImport from '../../components/MemberImport/MemberImport.svelte'

</script>

<MemberImport band={bands[0]} />
