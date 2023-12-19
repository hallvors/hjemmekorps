<script>
  import { createSubmitHandler } from '../utils/forms';
  import Button from '../Button/Button.svelte'
  export let targetUrl;
  const handleSubmit = createSubmitHandler(evt => {
    evt.target.reset();
    alert(
      'Dersom du har tilgang skal du nå ha fått innloggingslenke tilsendt. Sjekk epost!'
    );
  });
</script>

<form
  method="post"
  on:submit|preventDefault={handleSubmit}
  action="/api/communications/loginlink"
>
  <p>
    E-post: <input type="email" name="email" required />
    <br />
    <Button type="submit" className="fa fa-paper-plane">Send</Button>
    {#if targetUrl}
      <input type="hidden" name="url" value={targetUrl} />
    {/if}
  </p>
</form>
<style>
  input {
    padding: .8em;
    font-size: large;
  }
</style>
