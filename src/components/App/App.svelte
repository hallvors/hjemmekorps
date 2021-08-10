<script>
  export let user;
  import AdminHome from '../AdminHome/AdminHome.svelte';
  import UserHome from '../UserHome/UserHome.svelte';
  import GuestHome from '../GuestHome/GuestHome.svelte';
  if (typeof window !== 'undefined') {
    window.onerror = function (e) {
      console.log('onerror ', e);
      fetch('/api/errorlogging', {
      method: 'POST',
      credentials: 'same-origin',
      body: JSON.stringify({
        message: e.message || e,
        stack: e.stack || '',
        ua: navigator.userAgent,
        project: '',
        userid: user._id,
        url: location.href
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    };
  }
</script>

<div>
  {#if user && user._type === 'adminUser'}
    <AdminHome {user} />
  {:else if user && user._type === 'member'}
    <UserHome {user} />
  {:else}
    <GuestHome />
  {/if}
</div>
