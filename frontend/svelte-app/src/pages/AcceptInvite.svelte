<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { API_URL } from '../services/constants.js';

  let token = '';
  let password = '';
  let confirmPwd = '';
  let error = '';
  let success = false;
  let loading = false;

  onMount(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    token = params.get('token') || '';
  });

  async function submit() {
    error = '';

    if (password !== confirmPwd) {
      error = 'Les mots de passe ne correspondent pas';
      return;
    }
    if (password.length < 6) {
      error = 'Mot de passe trop court';
      return;
    }
    loading = true;
    const resp = await fetch(`${API_URL}/api/auth/accept-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    const data = await resp.json();
    loading = false;
    if (resp.ok) {
      success = true;
    } else {
      error = data.error || 'Erreur';
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
  {#if success}
    <h2>Mot de passe enregistré</h2>
    <p class="success">Vous pouvez maintenant vous connecter avec votre email et ce mot de passe.</p>
    <a href="#">Aller à la page de connexion</a>
  {:else}
    <h2>Définir mon mot de passe</h2>
    <label>
      Nouveau mot de passe
      <input type="password" bind:value={password} />
    </label>
    <label>
      Confirmer le mot de passe
      <input type="password" bind:value={confirmPwd} />
    </label>
    {#if error}
      <p class="error" in:fade>{error}</p>
    {/if}
    <button on:click={submit} disabled={loading}>{loading ? '...' : 'Valider'}</button>
  {/if}
</div> 