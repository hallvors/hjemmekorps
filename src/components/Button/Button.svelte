<script>
  export let onClick = () => {};
  export let type = 'button';
  export let small = false;
</script>

<button {type} on:click={onClick} class={small ? 'small' : 'large'}
  ><slot /></button
>

<style>
  button {
    font-size: 3vw;
    background-color: var(--light);
    color: var(--dark);
    transition: 0.8s;
    border-radius: 1vw;
    border: 2px solid;
    padding: 1vw 2vw;
    border-color: var(--secondaryColor);
  }

  button.small {
    font-size: 1.6vw;
  }

  button:hover,
  button:focus {
    animation: pulse 0.8s;
    box-shadow: 0 0 0 1em rgba(255, 255, 255, 0);
    background-color: var(--dark);
    color: var(--light);
  }
  button::after {
    content: ' ♪♪';
    color: var(--activeNoteColor);
  }
  button::before {
    content: '♪♪ ';
    color: var(--activeNoteColor);
  }
  button.small::after {
    content: none;
    color: var(--activeNoteColor);
  }
  button.small::before {
    content: none;
  }
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 var(--secondaryColor);
    }
  }
</style>
