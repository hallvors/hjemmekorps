<script>
  import { stores } from '@sapper/app';
  const { session } = stores();

  import RecordUI from '../RecordUI/RecordUI.svelte';

  // Dette får man fra backend
  let project;
  let band;
  let user;

  session.subscribe(data => {
    if (data.bands) {
      band = data.bands[0];
      project = data.projects[0];
    }
    user = data.user;
  });
</script>

<div class="main-wrapper">
  <div class="display">
    <RecordUi project user />
  </div>
</div>

<style>
  .main-wrapper {
    padding: 50px 0;
    width: 90%;
    margin: 0 auto;
  }


</style>