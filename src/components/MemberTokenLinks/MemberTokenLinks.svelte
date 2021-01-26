<script>
  export let project;
  let ulElement;
  let copied;

  function triggerSelectAndCopy() {
    let ok = false;
    if (document.body.createTextRange) {
      const range = document.body.createTextRange();
      range.moveToElementText(ulElement);
      range.select();
      ok = true;
    } else if (window.getSelection) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(ulElement);
      selection.removeAllRanges();
      selection.addRange(range);
      ok = true;
    }
    if (ok && document.execCommand('copy')) {
      copied = true;
    } else {
      copied = false;
    }
    setTimeout(() => {
      copied = undefined;
    }, 2500);
  }

  function areYouSure(evt) {
    if (
      !confirm(
        'Dersom du går til denne lenka, logger du inn som musikant. ' +
          'For å bruke dirigent-sidene igjen må du bruke dirigentens innloggings-lenke. ' +
          'Er du sikker på at du vil bytte til musikant-modus?'
      )
    ) {
      evt.preventDefault();
    }
  }
</script>

<div>
  <ul bind:this={ulElement}>
    {#each project.members as member}
      <li>
        <a href={'/?t=' + member.token} on:click={areYouSure}>{member.name}</a>
      </li>
    {/each}
  </ul>

  {#if copied === true}
    <p>Liste kopiert!</p>
  {:else if copied === false}
    <p>Kunne ikke kopiere, støttes ikke i din nettleser</p>
  {/if}

  <button on:click={triggerSelectAndCopy}>Kopier</button>
  <a href="/prosjekt/{project._id}">Tilbake</a>
</div>
