<script>
  import { instruments } from '../../lib/datastore';
  import { getRandomInt } from '../../lib/utils';
  export let message = 'Vent litt...';
  let rndInstr = [];
  function pickInstruments() {
    for (let i = 0; i < 3; i++) {
      rndInstr[i] = $instruments[getRandomInt(0, $instruments.length)];
    }
    setTimeout(pickInstruments, 8000);
  }
  pickInstruments()
</script>

<div class="background">

  <div class="loading">
    {#each rndInstr as instrument, idx}
    <img
    class="i{idx}"
      src="/images/instruments/{instrument.value}.png"
      alt=""
      />
      {/each}
      <p>{message}</p>
    </div>
  </div>

<style>
  .background {
    background-color: #999;
    opacity: .8;
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
  p {
    color: #999;
    letter-spacing: 8%;
    font-size: 5vw;
    text-align: center;
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
    -webkit-animation: spin 8s linear infinite;
    -moz-animation: spin 8s linear infinite;
    animation: spin 8s linear infinite;
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
