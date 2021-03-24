<div>
  <main>
    <slot />
  </main>

  <aside>
    <slot name="aside" />
  </aside>
</div>

<style>
  @media (min-width: 481px) {
    div {
      display: flex;
    }
    main {
      flex: 1;
      flex-basis: 65%;
    }
    aside {
      flex: 1;
      align-self: flex-start; /* required for sticky flex to work */
      position: sticky;
      top: 50px;
      max-height: calc(100vh - 50px);
      overflow-y: auto;
      overflow-x: none;
    }
  }
</style>
