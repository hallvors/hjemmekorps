
<script>
    import DeltakerDisplay from "./DeltakerDisplay.svelte"
    export let projectName = "Navnløst prosjekt";
    export let currentRoute;

    const members = [
        {
            navn: "Richard"
        },
        {
            navn: "Jakob Etternavn"
        },
        {
            navn: "Ove"
        },
        {
            navn: "Veldig langt navn har vi her"
        },
        {
            navn: "Kanskje best med bare fornavn?"
        },
    ]
</script>

<main> 
    <div class="members">
        <h1 class="members-title">Deltakere</h1>

        <DeltakerDisplay newMember={true}/>
        {#each members as member}
        <DeltakerDisplay member={member}/>
        {/each}

    </div>

    <div class="project-main">
        <div class="project-info">
            <h1 class="h1-bigger project-title">{projectName}</h1>
        </div>
    </div>
</main>



<style>
    :root {
        --padding-top: 30px;
    }
    main {
        display: flex;
    }

    .members {
        border-right: 1px solid black;
        padding: calc(var(--padding-top) + 10px) 0 0 20px;

        width: 34%;
    }

    .members-title {
        text-align: center;
        margin: 0;
        padding: 0;
    }

    .project-title {
        margin: 0;
        padding: 0;
    }

    .project-info {
        width: 85%;
        margin: auto;
    }

    .project-main {

        padding-top: var(--padding-top);

        width: 66%;

        /* border: 1px dashed lightcoral; */

    }

</style>
