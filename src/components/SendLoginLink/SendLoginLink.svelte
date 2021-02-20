<script>
  import { createSubmitHandler } from '../utils/forms';
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
    E-post: <input type="email" name="email" required /><button
      type="submit"
      class="fa fa-paper-plane">Send</button
    >
  </p>
</form>
