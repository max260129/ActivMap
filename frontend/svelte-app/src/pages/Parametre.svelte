<script>
  import Sidebar from "../components/Sidebar.svelte";
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { getSettings, updateSettings } from "../services/settings.js";
  import { preferences } from "../stores/preferences.js";
  import { t } from "../i18n.js";
  
  let mapStyle = "dark";
  let defaultDistance = 150;
  let maxPoints = 5000;
  let notificationsEnabled = true;
  let language = "fr";
  let username = "";
  let email = "";
  
  let message = "";
  
  // Valeurs « usine » des préférences
  const DEFAULTS = {
    map_style: 'dark',
    default_distance: 150,
    max_points: 5000,
    language: 'fr',
    notifications_enabled: true,
    username: '',
    email: ''
  };
  
  onMount(async () => {
    try {
      const data = await getSettings();
      ({
        map_style: mapStyle,
        default_distance: defaultDistance,
        max_points: maxPoints,
        language,
        notifications_enabled: notificationsEnabled,
        username,
        email
      } = data);
      preferences.set(data);
    } catch (e) {
      console.error(e);
    }
  });
  
  async function save() {
    const payload = {
      map_style: mapStyle,
      default_distance: defaultDistance,
      max_points: maxPoints,
      language,
      notifications_enabled: notificationsEnabled,
      username,
      email
    };
    try {
      await updateSettings(payload);
      message = "Préférences enregistrées !";
      preferences.set(payload);
    } catch (e) {
      message = "Erreur: " + e.message;
    }
  }
  
  function resetForm() {
    ({
      map_style: mapStyle,
      default_distance: defaultDistance,
      max_points: maxPoints,
      language,
      notifications_enabled: notificationsEnabled,
      username,
      email
    } = DEFAULTS);

    // Met à jour le store global pour garder la cohérence
    preferences.set({ ...DEFAULTS });

    message = "Paramètres remis aux valeurs par défaut.";
  }
</script>

<Sidebar />

<div class="content-auth">
  <div class="card">
    <h1>{t('settings')}</h1>
    
    <div class="settings-section">
      <h2>{t('map_settings')}</h2>
      <div class="form-group">
        <label for="mapStyle">{t('map_style')}</label>
        <select id="mapStyle" bind:value={mapStyle}>
          <option value="dark">Sombre</option>
          <option value="light">Clair</option>
          <option value="satellite">Satellite</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="defaultDistance">{t('default_distance')}</label>
        <input type="number" id="defaultDistance" bind:value={defaultDistance} min="50" max="1000" />
      </div>
      
      <div class="form-group">
        <label for="maxPoints">{t('max_points')}</label>
        <input type="number" id="maxPoints" bind:value={maxPoints} min="1000" max="10000" />
      </div>
    </div>
    
    <div class="settings-section">
      <h2>{t('general_prefs')}</h2>
      <div class="form-group checkbox-group">
        <label>
          <input type="checkbox" bind:checked={notificationsEnabled} />
          {t('enable_notifications')}
        </label>
      </div>
      
      <div class="form-group">
        <label for="language">{t('language')}</label>
        <select id="language" bind:value={language}>
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
    
    <div class="settings-section">
      <h2>{t('account_settings')}</h2>
      <div class="form-group">
        <label for="username">{t('username')}</label>
        <input type="text" id="username" bind:value={username} />
      </div>
      
      <div class="form-group">
        <label for="email">{t('email')}</label>
        <input type="email" id="email" bind:value={email} />
      </div>
      
      <button class="btn-change-password">{t('change_password')}</button>
    </div>
    
    {#if message}
      <p style="color: #0f0">{message}</p>
    {/if}
    <div class="action-buttons">
      <button class="btn-save" on:click|preventDefault={save}>{t('save')}</button>
      <button class="btn-reset" type="button" on:click={resetForm}>{t('reset')}</button>
    </div>
  </div>
</div>

<style>
  .content-auth {
    margin-left: var(--sidebar-width);
    width: calc(100% - var(--sidebar-width));
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
  }

  .card {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid #cc5200;
    padding: 2rem;
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(204, 82, 0, 0.5);
    width: 100%;
    max-width: 800px;
  }

  h1, h2 {
    color: #fff;
  }

  h1 {
    text-align: center;
    margin-bottom: 2rem;
  }

  h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid #444;
    padding-bottom: 0.5rem;
  }

  .settings-section {
    margin-bottom: 2rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #ccc;
  }

  input, select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #444;
    border-radius: 4px;
    background: #222;
    color: #fff;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .checkbox-group input {
    width: auto;
    margin: 0;
  }

  button {
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.2s, background-color 0.2s;
  }

  button:hover {
    transform: translateY(-2px);
  }

  .btn-change-password {
    background: #444;
    color: white;
    margin-top: 1rem;
  }

  .action-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
  }

  .btn-save {
    background: #cc5200;
    color: white;
  }

  .btn-reset {
    background: transparent;
    border: 1px solid #cc5200;
    color: #cc5200;
  }
</style> 