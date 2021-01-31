<script>
// TODO: should some of this logic move to routes/index.svelte?

//import { createEventDispatcher } from 'svelte';
//  const dispatch = createEventDispatcher();
  import LinkedBoxList from '../LinkedBoxList/LinkedBoxList.svelte';

  export let user;

import { bands, selectedBand, updateSelectedBand } from '../../lib/datastore';
  function onBandSelect(newBandIdx) {
    updateSelectedBand(newBandIdx);
  }
  let bandSelectorData = $bands.map((band, idx) => ({
    href: '#',
    onclick: function () {
      onBandSelect(idx);
    },
    title: band.name,
    active: idx === $selectedBand,
  }));
  let categoryLinks = [
    { title: 'Musikanter', href: '/musikanter' },
    { title: 'Låter', href: '/prosjekt' },
  ];
</script>

<div class="main-wrapper">
  <h1>Velkommen, {user.friendly_name}!</h1>

  {#if $bands.length > 1}
    <h2>Velg korps</h2>
    <LinkedBoxList items={bandSelectorData} />
  {/if}
  {#if $bands[$selectedBand].members.length > 0}
    <LinkedBoxList items={categoryLinks} />
  {:else}
    <p>
      Første steg er å <a href="/musikanter/import">importere musikanter</a>.
    </p>
  {/if}
</div>

<style>
  .main-wrapper {
    padding: 50px 0;
    width: 90%;
    margin: 0 auto;
  }
</style>
