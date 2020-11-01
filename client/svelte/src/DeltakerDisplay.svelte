<script>
    export let deltaker = {
        navn: "Navnløs",
    };

    let muted = false;
    function handleMute(e) {
        const button = e.currentTarget;

        if (!muted) {
            button.firstChild.classList.toggle("fa-volume-mute");
            button.firstChild.classList.toggle("fa-volume-up");

        }
        else {
            button.firstChild.classList.toggle("fa-volume-mute");
            button.firstChild.classList.toggle("fa-volume-up");
        };
        muted = !muted;


    }
</script>
<main>
    <h3>{deltaker.navn}</h3>
    <button class="mute-btn" on:click={handleMute}><i class="fas fa-volume-mute"></i></button>
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
        color: var(--textColorLight);
        padding: 5px 10px;
        border-radius: 100px;
    }
    .mute-btn:hover {
        cursor: pointer;
        background: none;
        color: var(--blue);
    }

</style>