<script>
  import { blur } from 'svelte/transition';

  export let points;
  export let furtherStats;
  export let extraPointsSinceLoad = 0;
</script>

<div class="frame">
  {#key points}
    <div transition:blur class="points">
      <p>
        <b>Du har spilt</b>
        {points} <b>noter i dag!</b>
      </p>
    </div>
  {/key}
  <p class="subinfo">
    <small
      ><b>Du har øvd </b>
      {furtherStats.userStreak} <b>{furtherStats.userStreak === 1 ? 'dag' : 'dager'} i strekk. Hele korpset har øvd </b>
      {furtherStats.bandStreak} <b>{furtherStats.bandStreak === 1 ? 'dag' : 'dager'} i strekk.</b></small
    >
    <br />
    <small
      ><b>Til sammen har du spilt </b>
      {furtherStats.userPointsTotal + extraPointsSinceLoad} <b> noter og korpset </b>
      {furtherStats.bandPointsTotal + extraPointsSinceLoad} noter</small
    >
  </p>
</div>

<style type="text/css">
  .frame {
    width: 100%;
    border: 1px solid;
    border-color: var(--border);
    text-align: center;
    font-size: large;
    min-height: 3em;
    position: relative;
    padding-top: 2.5em;
    box-shadow: var(--shadow);
  }
  .points {
    color: var(--activeNoteColor);
    font-size: large;
    min-height: 2em;
    position: absolute;
    top: 0;
    width: 100%;
    text-align: center;
  }
  .points:hover {
    text-shadow:
      1px 1px 2px black,
      0 0 1em var(--activeNoteColor),
      0 0 0.2em var(--activeNoteColor);
    color: var(--light);
  }
  .subinfo {
    font-size: small;
    color: var(--textColorLessDark);
  }
</style>
