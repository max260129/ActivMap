<script>
  import Sidebar from "../components/Sidebar.svelte";
  
  // Valeurs factices pour les paramètres
  let mapStyle = "dark";
  let defaultDistance = 150;
  let maxPoints = 5000;
  let notificationsEnabled = true;
  let language = "fr";
  let username = "Utilisateur";
  let email = "utilisateur@exemple.com";
</script>

<Sidebar />

<div class="content-auth">
  <div class="card">
    <h1>Paramètres</h1>
    
    <div class="settings-section">
      <h2>Paramètres de carte</h2>
      <div class="form-group">
        <label for="mapStyle">Style de carte</label>
        <select id="mapStyle" bind:value={mapStyle}>
          <option value="dark">Sombre</option>
          <option value="light">Clair</option>
          <option value="satellite">Satellite</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="defaultDistance">Distance par défaut (m)</label>
        <input type="number" id="defaultDistance" bind:value={defaultDistance} min="50" max="1000" />
      </div>
      
      <div class="form-group">
        <label for="maxPoints">Points maximum</label>
        <input type="number" id="maxPoints" bind:value={maxPoints} min="1000" max="10000" />
      </div>
    </div>
    
    <div class="settings-section">
      <h2>Préférences générales</h2>
      <div class="form-group checkbox-group">
        <label>
          <input type="checkbox" bind:checked={notificationsEnabled} />
          Activer les notifications
        </label>
      </div>
      
      <div class="form-group">
        <label for="language">Langue</label>
        <select id="language" bind:value={language}>
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
    </div>
    
    <div class="settings-section">
      <h2>Paramètres du compte</h2>
      <div class="form-group">
        <label for="username">Nom d'utilisateur</label>
        <input type="text" id="username" bind:value={username} />
      </div>
      
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" bind:value={email} />
      </div>
      
      <button class="btn-change-password">Changer le mot de passe</button>
    </div>
    
    <div class="action-buttons">
      <button class="btn-save">Enregistrer les modifications</button>
      <button class="btn-reset">Réinitialiser</button>
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