<script>
  import { onMount } from 'svelte';
  let visible = false;
  const STORAGE_KEY = 'cookie_consent';

  let bannerEl; // élément DOM du bandeau pour le focus

  onMount(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) visible = true;

    // Gestion touche Échap pour fermer
    const handleKeydown = e => {
      if (visible && e.key === 'Escape') {
        accept();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  // Quand le bandeau devient visible, placer le focus
  $: if (visible) {
    // attendre que le DOM soit prêt
    setTimeout(() => {
      bannerEl?.focus();
    }, 0);
  }

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
    outline: none; /* pour le focus */
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
  <div
    class="banner"
    role="dialog"
    aria-modal="true"
    aria-labelledby="cookie-title"
    tabindex="-1"
    bind:this={bannerEl}
  >
    <p id="cookie-title" style="margin:0; font-weight:700;">Gestion des cookies</p>
    <span>Nous utilisons des cookies techniques nécessaires au fonctionnement du site.</span>
    <a href="#privacy">En savoir plus</a>
    <button on:click={accept}>J'ai compris</button>
  </div>
{/if} 