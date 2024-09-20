<script>
  import { blur } from 'svelte/transition';

  export let points;
  export let furtherStats;
  export let subGroupName;
  export let extraPointsSinceLoad = 0;
  // hack for grammar.. if name ends in 'korps' add -et
  if (/korps$/.test(subGroupName)) {
    subGroupName += 'et';
  }
</script>

<div class="frame">
  {#key points}
    <div transition:blur class="points">
      <p>
        <b>Du har fått</b>
        {points} <b>poeng i dag!</b>
        <br><b>Hele {subGroupName.toLowerCase()} har fått</b> {furtherStats.groupPointsThisWeek} <b>poeng denne uka</b>!
      </p>
    </div>
  {/key}
  <p class="subinfo">
    <small
      ><b>Du har øvd </b>
      {furtherStats.userStreak}
      <b
        >{furtherStats.userStreak === 1 ? 'dag' : 'dager'} i strekk, {subGroupName.toLowerCase()}</b>
        {furtherStats.groupStreak}
        <b
          >{furtherStats.groupStreak === 1 ? 'dag' : 'dager'} og hele korpset har
          øvd
        </b>
        {furtherStats.bandStreak}
        <b>{furtherStats.bandStreak === 1 ? 'dag' : 'dager'} i strekk.</b>
      </small
    >
    <br />
    <small
      ><b>Til sammen har du </b>
      {furtherStats.userPointsTotal + extraPointsSinceLoad}
      <b>
        poeng, {subGroupName.toLowerCase()}
      </b>{furtherStats.groupPointsTotal + extraPointsSinceLoad}<b>,
        og hele korpset
      </b>
      {furtherStats.bandPointsTotal + extraPointsSinceLoad} <b>poeng</b></small
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
