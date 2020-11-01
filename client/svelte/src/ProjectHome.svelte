
<script>
    import DeltakerDisplay from "./DeltakerDisplay.svelte"
</script>

<main> 
    <div class="members">
        <DeltakerDisplay navn="Richard"/>
    </div>
    <div class="project-main">Dette er prosjektet</div>
</main>



<style>
    :root {
        --height: 800px;
    }
    main {
        display: flex;
    }
    .members {
        border: 1px solid black;
        width: 30%;
        height: var(--height);
        /* position: fixed; */
    }
    .project-main {
        width: 70%;
        height: var(--height);

        border: 1px dashed lightcoral;

    }
</style>
