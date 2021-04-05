<script>
  export let href = '';
  export let id = '';
  if (id && !href) {
    href = `/prosjekt/${id}`;
  }
</script>

<p>
  <a {href} on:click={() => history.back()}
    ><i class="fa fa-arrow-left" aria-hidden="true" />
    Tilbake</a
  >
</p>
