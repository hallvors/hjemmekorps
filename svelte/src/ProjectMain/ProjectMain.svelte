<script>
    import DeltakerDisplay from "./DeltakerDisplay.svelte";
    import ProjectHome from "./ProjectHome.svelte";
    import {projects} from "../stores.js";

    export let id;
    let currentProject;
    let unsubProjects = projects.subscribe(theProjects => {
        currentProject = theProjects.find(project => project._id === id) || {};
    });

    // Todo:
    // Tegne linjer med svg
    // Fullføre resten
</script>
<main>
    <div class="members">
        <h1 class="members-title">Deltakere</h1>

        <DeltakerDisplay newMember={true}/>
        {#each currentProject.members || [] as member}
        <a href="/">
            <DeltakerDisplay member={member}/>
        </a>
        {/each}

        <!-- <svg class="member-line">
            <polyline points="0,100 50,100 50,15 100,15"
            style="fill: none; stroke:var(--dark); stroke-width: 30;"/>
        </svg> -->

    </div>

    <div class="project-main">
        <div class="project-info">
            <h1 class="h1-bigger project-title">{currentProject.name}</h1>

            <!-- Her bør det routes -->
            <ProjectHome />
        </div>


    </div>
</main>



<style>
    :root {
        --padding-top: 30px;
        --members-width: 34%;
    }
    main {
        display: flex;
    }

    .members {
        border-right: var(--border);
        padding: calc(var(--padding-top) + 10px) 0 20px 0 ;

        width: var(--members-width);
    }


    .members-title {
        text-align: center;
        margin: 0;
        padding: 0;
    }

    /* || CSS for possible lines between stuff */

    /* .member-line {
        height: 20%;
        width: 8%;

        position: absolute;
        left: calc(var(--members-width) - 21px);
        top: 300px;
        border: var(--border);
    } */

    /* || Project-main */

    .project-main {
        padding-top: var(--padding-top);
        width: 66%;
    }

    .project-title {
        margin: 0;
        padding: 0;
    }

    .project-info {
        width: 85%;
        margin: auto;
    }

    /* .audio {

        border: 1px dashed lightcoral;
    } */

    /* .audio-controls {
        background-color: var(--dark);
        color: var(--light);
    } */

</style>
