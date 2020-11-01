<script>
    export let deltaker = {
        navn: "Navnløs",
    };
</script>
<main>
    <h3>{deltaker.navn}</h3>
    <button class="mute-btn">Mute</button>
</main>
<style>
    main {
        margin: 10px;
        padding: 5px;
        /* text-align: center; */
        border: 1px solid black;
    }
    .mute-btn {
        border: 1px solid black;
        background: #333;
        color: white;
        padding: 5px 10px;
        border-radius: 100px;
    }
    .mute-btn:hover {
        cursor: pointer;
        background: none;
        color: var(--example);
    }

</style>