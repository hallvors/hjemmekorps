<script>
  export let onClick = () => {};
  export let type = 'button';
</script>

<button {type} on:click={onClick}><slot /></button>

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

  button:hover,
  button:focus {
    animation: pulse 0.8s;
    box-shadow: 0 0 0 1em rgba(255, 255, 255, 0);
    background-color: var(--dark);
    color: var(--light);
  }
  button::after {
    content: " ♪♪";
    color: var(--activeNoteColor);
  }
  button::before {
    content: "♪♪ ";
    color: var(--activeNoteColor);
  }
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 var(--secondaryColor);
    }
  }
</style>
