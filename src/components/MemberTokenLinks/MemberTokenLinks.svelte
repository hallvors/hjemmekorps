<script>
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
    console.log('event fires', event)
    const plainTextLinks = [];
    const links = ulElement.getElementsByTagName('a');
    for (let i = 0; i < links.length; i++) {
      plainTextLinks.push(links[i].textContent);
      plainTextLinks.push(links[i].href);
      plainTextLinks.push('');
    }
    console.log({plainTextLinks})
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
  <ul bind:this={ulElement}>
    {#each project.partslist as part}
      {#each part.members as memRef}
        <li>
          <a href={'/?t=' + memRef.token} on:click={areYouSure}>{nameMap[memRef._ref]}</a
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

  <button on:click={triggerSelectAndCopy}>Kopier</button>
  <a href="/prosjekt/{project._id}">Tilbake</a>
</div>
