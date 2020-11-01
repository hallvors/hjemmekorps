<script>

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

    export let newMember = false;

    export let member = {
        navn: "Navnløs",
    };

</script>

{#if !newMember}
<main>
    <h3>{member.navn}</h3>
    <button class="mute-btn" on:click={handleMute}><i class="fas fa-volume-up"></i></button>
</main>

{:else}
<main class="new-member">
    <div class="plus-sign">
        <svg xmlns="http://www.w3.org/2000/svg" class="iconic-plus-thin injected-svg iconic iconic-lg iconic-main" width="80" height="80" viewBox="0 0 128 128" data-src="/iconic/svg/plus-thin.svg">
        <g class="iconic-plus-thin-lg iconic-container iconic-lg" data-width="128" data-height="128" display="inline">
          <path stroke="#000" stroke-width="2" stroke-linecap="square" class="iconic-property-stroke" d="M64 4v120m60-60h-120" fill="none"></path>
        </g>
      </svg>
    </div>

</main>
{/if}

<style>
    main {
        min-height: 118px;
        margin: 20px;
        padding: 5px 20px;
        /* text-align: center; */
        border: var(--border);
    }

    /* main:hover {
        cursor: pointer;
    } */

    .new-member {
        position: relative
    }
    
    .new-member:hover {
        cursor: pointer;
    }

    .plus-sign {
        position: absolute;
        /* 64px is half of plus sign-width and height */
        top: calc(50% - 40px);
        left: calc(50% - 40px);
    }
    .mute-btn {
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