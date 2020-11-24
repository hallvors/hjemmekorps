
<script>
    import DeltakerDisplay from "./DeltakerDisplay.svelte";
    import NoteBox from "./NoteBox.svelte"
    // import Route from "svelte-router-spa";
    // export let currentRoute;

    export let projectName = "Navnløst prosjekt";

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
    // Todo:
    // Tegne linjer med svg
    // Fullføre resten 
</script>

<main> 
    <div class="members">
        <h1 class="members-title">Deltakere</h1>

        <DeltakerDisplay id="test" newMember={true}/>
        {#each members as member}
        <DeltakerDisplay member={member}/>
        {/each}

        <!-- <svg class="member-line">
            <polyline points="0,100 50,100 50,15 100,15"
            style="fill: none; stroke:var(--dark); stroke-width: 30;"/>
        </svg> -->

    </div>

    <div class="project-main">
        <div class="project-info">
            <h1 class="h1-bigger project-title">{projectName}</h1>

            <!-- Her bør det routes -->
            <div class="merged-audio">
                <h1 style="text-align: center;">Samlet lydfil</h1>
                <span class="audio">
                    <audio controls src="../samples/sample.mp3">
                        <track kind="captions"/>
                        Audio does not work
                    </audio>
                </span>

            </div>

            <NoteBox/>
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

    .merged-audio {
        text-align: center;

        margin-top: 30px;
        padding-bottom: 30px;
        border: var(--border);
        box-shadow: var(--shadow);
    }

    .note-box {
        margin-top: 30px;
        padding: 5%;
        height: 20vw;
    }

    .note-box h1 {
        padding: 0;
        margin: 0;
    }


    /* .audio {

        border: 1px dashed lightcoral;
    } */

    /* .audio-controls {
        background-color: var(--dark);
        color: var(--light);
    } */

</style>
