<script>
  import UsageHint from '../UsageHint/UsageHint.svelte';
  export let project;
  export let members;
  let ulElement;
  let copied;
  let nameMap = {};
  members.forEach(m => {
    nameMap[m._id] = m.name;
  });

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

  document.addEventListener('copy', event => {
    const plainTextLinks = [];
    const links = ulElement.getElementsByTagName('a');
    for (let i = 0; i < links.length; i++) {
      plainTextLinks.push(links[i].textContent);
      plainTextLinks.push(links[i].href);
      plainTextLinks.push('');
    }
    event.clipboardData.setData('text/plain', plainTextLinks.join('\n'));
    event.clipboardData.setData('text/html', ulElement.outerHTML);
    event.preventDefault();
  });

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
  <p>
    Du kan også kopiere lenker for å sende hver enkelt eller lime inn i en annen
    epost.
  </p>
  <p>Lenkene under går til innspillings-sider for hver enkelt musikant.</p>

  <UsageHint
    message="Tips: vil du se musikantenes sider for øving og opptak?
    Høyre-klikk lenka og velg 'åpne i privat vindu'. Da er du fortsatt
    logget inn som dirigent i dette vinduet, og kan se sida musikantene
    skal bruke i det nye."
    textAlign="left"
  />

  <ul bind:this={ulElement}>
    {#each project.partslist as part}
      {#each part.members as memRef}
        <li>
          <a href={'/?t=' + memRef.token} on:click={areYouSure}
            >{nameMap[memRef._ref]}</a
          >
        </li>
      {/each}
    {/each}
  </ul>

  {#if copied === true}
    <p>Liste kopiert!</p>
  {:else if copied === false}
    <p>Kunne ikke kopiere, støttes ikke i din nettleser</p>
  {/if}

  <button on:click={triggerSelectAndCopy}>Kopier alle lenker</button>

</div>
