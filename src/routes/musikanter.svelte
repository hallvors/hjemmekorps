<script context="module">
  export async function preload(page, session) {
    const bands = session.bands;
    const members = {};
    for (let i = 0; i < bands.length; i++) {
      let band = bands[i];
      const res = await this.fetch(
        `/api/members/byband/${encodeURIComponent(band._id)}`
      );
      members[band._id] = await res.json();
    }
    return {
      bands,
      members,
      instruments: session.instruments,
    };
  }
</script>

<script>
  import MemberList from '../components/MemberList/MemberList.svelte';
  // TODO: UI for selecting a different band?

  export let members;
  export let bands;
  export let instruments;

  console.log({ bands, members });
  let selectedBand = bands[0];

  function onUpdate(data) {
    data.detail.forEach(item => {
      let existing =
        members &&
        members[selectedBand._id] &&
        members[selectedBand._id].find(member => member.name === item.name);
      if (existing) {
        Object.assign(existing, item);
      } else {
        members[selectedBand._id].push(item);
      }
    });
    // assignment triggers updating - array.push() etc does not (sorry, hack)
    members = Object.assign({}, members);
  }
</script>

<svelte:head><title>Musikanter</title></svelte:head>

<h1>Musikanter</h1>

<MemberList
  members={members[selectedBand._id]}
  band={selectedBand}
  instruments={instruments}
  on:dataupdate={onUpdate}
/>
