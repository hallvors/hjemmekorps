<script>
  export let href = '';
  export let id = '';
  if (id && !href) {
    href = `/prosjekt/${id}`;
  }
</script>

<p>
  <a {href} on:click={() => history.back()}
    >Videre <i class="fa fa-arrow-right" aria-hidden="true" />
  </a>
</p>
