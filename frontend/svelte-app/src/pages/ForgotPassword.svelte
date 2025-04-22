<script>
  import { fade } from 'svelte/transition';
  import { API_URL } from '../services/constants.js';

  let email = '';
  let sent = false;
  let error = '';
  let loading = false;

  async function submit() {
    error = '';
    if (!email) {
      error = 'Veuillez entrer votre email';
      return;
    }
    loading = true;
    try {
      const resp = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      await resp.json();
      sent = true; // Toujours succès, réponse générique
    } catch (e) {
      error = 'Erreur réseau';
    } finally {
      loading = false;
    }
  }
</script>

<style>
  .card { max-width: 400px; margin: 2rem auto; background:#111; border:1px solid #cc5200; padding:2rem; border-radius:12px; }
  label { display:flex; flex-direction:column; margin-bottom:1rem; }
  input { padding:0.6rem; background:#222; color:#fff; border:1px solid #444; border-radius:4px; }
  button{ background:#cc5200; border:none; color:#fff; padding:0.8rem 1.4rem; border-radius:4px; cursor:pointer; }
  p.error{ color:#ff4444; }
  p.success{ color:#44ff44; }
</style>

<div class="card" in:fade>
  {#if sent}
    <h2>Vérifiez votre boîte mail</h2>
    <p class="success">Si un compte existe, un e‑mail de réinitialisation a été envoyé.</p>
    <a href="#">Retour à la connexion</a>
  {:else}
    <h2>Mot de passe oublié</h2>
    <label>
      Email
      <input type="email" bind:value={email} />
    </label>
    {#if error}
      <p class="error" in:fade>{error}</p>
    {/if}
    <button on:click={submit} disabled={loading}>{loading ? '...' : 'Envoyer'}</button>
  {/if}
</div> 