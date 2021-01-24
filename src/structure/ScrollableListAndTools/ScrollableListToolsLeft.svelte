<div>
    <aside>
        <slot name="aside" />
      </aside>
  
    <main>
      <slot />
    </main>
  </div>
  
  <style>
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
      top: 10px;
      max-height: calc(100vh - 10px);
      overflow-y: auto;
    }
  </style>
  