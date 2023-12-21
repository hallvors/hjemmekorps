<script>
    export let instrument;
    export let percentage = 0;
</script>
<div class="progress">
<div
  class="i1"
  style="background-image: url(/images/instruments/{instrument}.png);"
></div>
<div
  class="i2"
  style="background-image: url(/images/instruments/{instrument}.png); clip-path: inset(0px {64 - (64 * percentage / 100)}px 0px 0px)"
></div>
</div>


<style>
.progress {
    position: relative;
    width: 64px;
    height: 64px;
    margin-left: auto;
    margin-right: auto;
  }
  .progress div.i1,
  .progress div.i2 {
    width: 64px;
    height: 64px;
    position: absolute;
    left: 0;
    background-size: cover;
  }
  .progress div.i2 {
    clip-path: inset(0px 64px 0px 0px);
    filter: invert(42%) sepia(94%) saturate(3108%) hue-rotate(167deg)
      brightness(103%) contrast(103%);
  }

</style>