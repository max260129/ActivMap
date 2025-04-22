<script>
  import { onMount } from 'svelte';
  let visible = false;
  const STORAGE_KEY = 'cookie_consent';

  onMount(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) visible = true;
  });

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    visible = false;
  }
</script>

<style>
  .banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0,0,0,0.9);
    color: #fff;
    padding: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    z-index: 1000;
  }
  .banner button {
    background: #cc5200;
    border: none;
    color: #fff;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }
</style>

{#if visible}
  <div class="banner">
    Nous utilisons des cookies techniques nécessaires au fonctionnement du site. <a href="#privacy">En savoir plus</a>
    <button on:click={accept}>J'ai compris</button>
  </div>
{/if} 