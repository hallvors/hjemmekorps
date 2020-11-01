
<script>
    import DeltakerDisplay from "./DeltakerDisplay.svelte"
    export let projectName = "Navnløs";
    export let currentRoute;

    const members = [
        {
            navn: "Richard"
        },
        {
            navn: "Ove"
        },
    ]
</script>

<main> 
    <div class="members">
        <h1 class="members-title">Deltakere</h1>
        {#each members as member}
        <DeltakerDisplay deltaker={member}/>
        {/each}
    </div>
    <div class="project-main">
        <h1>{currentRoute.namedParams.id}</h1>
        Dette er prosjektet</div>
</main>



<style>
    :root {
        --height: 800px;
    }
    main {
        padding-top: 20px;
        display: flex;
    }
    .members {
        border: 1px solid black;
        width: 30%;
        height: var(--height);
        /* position: fixed; */
    }

    .members-title {
        text-align: center;
    }
    .project-main {
        width: 70%;
        height: var(--height);

        border: 1px dashed lightcoral;

    }
</style>
