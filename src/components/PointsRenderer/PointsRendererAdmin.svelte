<script>
  import { blur } from 'svelte/transition';

  export let points;
  function determinative(nameStr) {
    return /korps$/.test(nameStr) ? nameStr + 'et' : nameStr;
  }
</script>

<div class="frame">
  <table>
    <tr><th colspan="2" class="categoryhead">I dag</th></tr>
    {#each points.groupPointsToday as groupPoints}
      <tr>
        <th>{determinative(groupPoints.subgroup)}</th>
        <td>{groupPoints.points}</td>
      </tr>
    {/each}
    <tr><th>Hele korpset i dag</th><td>{points.bandPointsToday}</td></tr>
    <tr><th colspan="2" class="categoryhead">Strekk</th></tr>
    {#each points.groupStreak as gStreak}
      <tr
        ><th>{gStreak.subgroup}</th><td>{gStreak.streak} dager i strekk.</td
        ></tr
      >
    {/each}
    <tr
      ><th>Hele korpset</th><td>
        {points.bandStreak}
        {points.bandStreak === 1 ? 'dag' : 'dager'} i strekk
      </td></tr
    >
    <tr><th colspan="2" class="categoryhead">Poeng til sammen</th></tr>
    {#each points.groupPointsTotal as groupPoints}
      <tr>
        <th>{determinative(groupPoints.subgroup)}</th>
        <td>{groupPoints.points}</td>
      </tr>
    {/each}
    <tr><th>Hele korpset</th><td>{points.bandPointsTotal}</td></tr>
  </table>
</div>

<style type="text/css">
  .frame {
    width: 100%;
    border: 1px solid;
    border-color: var(--border);
    text-align: center;
    font-size: large;
    min-height: 3em;
    padding-top: 2.5em;
    box-shadow: var(--shadow);
  }
  .categoryhead {
    color: var(--activeNoteColor);
    font-size: large;
    min-height: 2em;
    text-align: center;
  }
  table {
    color: var(--textColorLessDark);
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #bbb;
  }
  td,
  th {
    vertical-align: top;
    border: 1px solid #bbb;
    padding: 12px;
  }
  th {
    text-align: left;
  }
</style>
