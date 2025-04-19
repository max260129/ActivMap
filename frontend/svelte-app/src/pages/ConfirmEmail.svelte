// Fichier créé pour gérer la confirmation d'adresse e‑mail

<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { API_URL } from '../services/constants.js';

  let status = 'pending'; // pending | success | error
  let message = '';

  onMount(async () => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const token = params.get('token');
    if (!token) {
      status = 'error';
      message = 'Token manquant';
      return;
    }
    try {
      const resp = await fetch(`${API_URL}/api/auth/confirm-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await resp.json();
      if (resp.ok) {
        status = 'success';
        message = data.message || 'Compte confirmé';
      } else {
        status = 'error';
        message = data.error || data.message || 'Erreur';
      }
    } catch (e) {
      status = 'error';
      message = 'Erreur réseau';
    }
  });
</script>

<style>
  .card { max-width: 400px; margin: 2rem auto; background:#111; border:1px solid #cc5200; padding:2rem; border-radius:12px; }
  p.error{ color:#ff4444; }
  p.success{ color:#44ff44; }
  a{ color:#cc5200; }
</style>

<div class="card" in:fade>
  {#if status === 'pending'}
    <h2>Confirmation en cours…</h2>
    <p>Merci de patienter…</p>
  {:else if status === 'success'}
    <h2>Adresse confirmée !</h2>
    <p class="success">{message}</p>
    <a href="#">Aller à la connexion</a>
  {:else}
    <h2>Erreur</h2>
    <p class="error">{message}</p>
    <a href="#">Retour à la connexion</a>
  {/if}
</div> 