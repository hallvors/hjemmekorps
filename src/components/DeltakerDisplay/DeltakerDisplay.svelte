<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function dispatchClick() {
    dispatch('click', member);
  }

  export let member;
  export let projectName;
  export let assignmentInfo = {};

</script>

{#if member}
  <div on:click={dispatchClick}>
    {#if member.instrument}
      <figure class="instrument">
        <img
          src={'/images/instruments/' + member.instrument + '.png'}
          alt={member.instrument}
          class="instrument-icon"
        />
        <figcaption>{member.instrument}</figcaption>
      </figure>
    {/if}

    {#if member.portraitUrl}
      <figure class="portrait">
        <img src={member.portraitUrl} alt={member.name} />
        <figcaption>{member.name}</figcaption>
      </figure>
    {/if}
    <h3>{member.name}</h3>
    {#if member.subgroup}<p>{member.subgroup}</p>{/if}
    {#if assignmentInfo && assignmentInfo.part}<p class="part">
        <em
          >{assignmentInfo.part}{#if projectName}, {projectName}{/if}</em
        >
      </p>{/if}
  </div>
{/if}

<style>
  div {
    min-height: 118px;
    margin: 20px;
    padding: 5px 20px;
    /* text-align: center; */
    border: var(--border);
    box-shadow: var(--shadow);
    width: 100%;
    transition: 0.3s;
    vertical-align: top;
  }

  figcaption {
    visibility: hidden;
  }

  h3 {
    text-transform: none;
    vertical-align: top;
  }

  div:hover {
    cursor: pointer;
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.75);
  }

  .instrument {
    max-width: 64px;
    float: right;
  }
  .instrument img {
    max-width: 100%;
  }

  .part {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0;
    margin: 0;
  }

  .portrait {
    max-width: 20%;
    vertical-align: bottom;
    margin-left: -20px;
  }
</style>
