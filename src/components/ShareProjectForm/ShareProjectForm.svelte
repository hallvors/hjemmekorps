<script>
  import { goto } from '@sapper/app';
  import { createSubmitHandler } from '../utils/forms';
  export let project;
  export let user;
  const handleSubmit = createSubmitHandler(() => {
    alert('Sendt!');
    goto(`/prosjekt/${project._id}`);
  });
</script>

<div>
  <h1>Send epost</h1>
  <p>Fullfør eposten med en liten hilsen til musikantene.</p>

  <form
    method="post"
    on:submit|preventDefault={handleSubmit}
    action="/api/communications/shareproject"
  >
    <div class="email">
      <p>
        <b>Hei, NAVN</b>!
      </p>
      <p>
        Her kommer det nye noter fra dirigent {user.friendly_name}. Du skal øve på
        <em>{project.name}</em>! Melding fra dirigenten:
      </p>
      <input type="hidden" name="projectId" value={project._id} />
      <textarea
        name="message"
        placeholder="Skriv din egen melding til musikantene her. Alle musikanter får samme tekst."
        required
      />
      <p>
        <!-- svelte-ignore a11y-invalid-attribute -->
        Klikk her for å se notene og sende inn opptak:
        <a href="#">https://...</a>
      </p>
      <p>
        <em
          >Du kan ikke svare på denne eposten. Dersom du har spørsmål, ta
          kontakt med {user.friendly_name}.</em
        >
      </p>
    </div>
    <button type="submit" class="fa fa-paper-plane">Send</button>
  </form>
  <p>
    Eposten sendes til foresatte - og til musikanten dersom vi har adresse.
    Lenker til notene for hver enkelt legges inn automatisk.
  </p>
</div>

<style>
  textarea {
    width: 100%;
    height: 250px;
    border: none;
  }
  .email {
    border: 1px solid black;
    box-shadow: 5px 5px 4px -3px #000000;
    padding: 1em 3em;
    margin-bottom: 1em;
    max-width: 800px;
  }
</style>
