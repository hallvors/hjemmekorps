<script>
  import { onMount } from 'svelte';

  import { instruments } from '../../lib/datastore';
  import { getRandomInt } from '../../lib/utils';
  export let message = 'Vent litt...';
  export let subMessage = '';
  let rndInstr = [];
  function pickInstruments() {
    for (let i = 0; i < 3; i++) {
      rndInstr[i] = $instruments[getRandomInt(0, $instruments.length)];
    }
    setTimeout(pickInstruments, 8000);
  }
  onMount(() => pickInstruments());
</script>

<div class="background">
  <div class="loading">
    <p class="mainmsg">{message}</p>
    {#each rndInstr as instrument, idx}
      {#if instrument && instrument.value}
        <img
          class="i{idx}"
          src="/images/instruments/{instrument.value}.png"
          alt=""
        />
      {/if}
    {/each}
    {#if subMessage}<aside>{subMessage}</aside>{/if}
  </div>
</div>

<style>
  .background {
    background-color: #999;
    opacity: 0.9;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 10;
  }
  .loading {
    position: relative;
    width: 86%;
    height: 86%;
    background: #fff;
    margin-top: 4%;
    margin-left: 7%;
    padding-top: 4%;
    border-radius: 100px;
  }
  p,
  aside {
    color: #444;
    letter-spacing: 8%;
    text-align: center;
    font-size: 5vw;
  }
  p {
    margin-top: 15vh;
  }
  aside {
    font-size: 2.5vw;
    position: absolute;
    bottom: 10vh;
    width: 100%;
  }

  img {
    width: 10%;
    position: absolute;
  }

  img.i0 {
    top: 45%;
    left: 15%;
  }
  img.i1 {
    top: 45%;
    left: 45%;
  }
  img.i2 {
    top: 45%;
    left: 75%;
  }
  img {
    -webkit-animation: spin 10s linear infinite;
    -moz-animation: spin 10s linear infinite;
    animation: spin 10s linear infinite;
  }
  @-moz-keyframes spin {
    100% {
      -moz-transform: rotate(360deg);
    }
  }
  @-webkit-keyframes spin {
    100% {
      -webkit-transform: rotate(360deg);
    }
  }
  @keyframes spin {
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
</style>
