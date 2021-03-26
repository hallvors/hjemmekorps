<script context="module">
    export async function preload(page, session) {
      let id = page.params.id;
      return { id };
    }
  </script>
  
  <script>
    export let id;
    import {
      bands,
      selectedBand,
      projects,
      updateProjects,
      members,
      assignments,
      updateProjectAssignment,
    } from '../../../lib/datastore';
    import ProjectMain from '../../../components/ProjectMain/ProjectMain.svelte';
    import ForwardBackNav from '../../../components/ForwardBackNav/ForwardBackNav.svelte';
  
    function onPartsUpdate(evt) {
      updateProjectAssignment(evt.detail.id, evt.detail.partslist);
    }
    function onUpdate(evt) {
      updateProjects({ [evt.detail._id]: evt.detail });
    }
    let project = $projects[id];
  </script>
  <svelte:head><title>{project.name} - hjemmekorps.no</title></svelte:head>
  
  <ProjectMain
    {project}
    members={$members}
    assignments={$assignments}
    band={$bands[$selectedBand]}
    on:partsupdate={onPartsUpdate}
    on:dataupdate={onUpdate}
  />
  
  <p>
    <ForwardBackNav {id} forward={`/prosjekt/${id}/send`} />
  </p>
  
  