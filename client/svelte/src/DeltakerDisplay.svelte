<script>
    export let deltaker = {
        navn: "Navnløs",
    };

    let muted = false;
    function handleMute(e) {
        if (!muted) {
            e.target.innerText = "Muted";
        }
        else {
            e.target.innerText = "Mute";
        };
        muted = !muted;
    }
    // todo:
    // Alt det naturlige
    // Bytte ut tekst med et ikon med mute og muted
</script>
<main>
    <h3>{deltaker.navn}</h3>
    <button class="mute-btn" on:click={handleMute}>Mute</button>
</main>
<style>
    main {
        margin: 10px;
        padding: 5px 30px;
        /* text-align: center; */
        border: 1px solid var(--dark);
    }
    .mute-btn {
        /* margin-left: ; */
        border: 1px solid var(--dark);
        background: var(--dark);
        color: var(--light);
        padding: 5px 10px;
        border-radius: 100px;
    }
    .mute-btn:hover {
        cursor: pointer;
        background: none;
        color: var(--blue);
    }

</style>