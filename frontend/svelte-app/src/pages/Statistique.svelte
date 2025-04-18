<script>
  import Sidebar from "../components/Sidebar.svelte";
</script>

<Sidebar />

<div class="content-auth">
  <div class="card">
    <h1>Statistiques</h1>
    <div class="stats-container">
      <div class="stat-card">
        <h3>Cartes générées</h3>
        <p class="stat-value">24</p>
      </div>
      <div class="stat-card">
        <h3>Distance totale</h3>
        <p class="stat-value">125 km</p>
      </div>
      <div class="stat-card">
        <h3>Utilisation hebdomadaire</h3>
        <p class="stat-value">+15%</p>
      </div>
    </div>
    <div class="graph-container">
      <h2>Activité mensuelle</h2>
      <div class="graph-placeholder">
        <p>Graphique d'activité (données à venir)</p>
      </div>
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
    text-align: center;
    margin-bottom: 1.5rem;
    color: #fff;
  }

  .stats-container {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: rgba(20, 20, 20, 0.8);
    border-radius: 8px;
    padding: 1.5rem;
    flex: 1;
    text-align: center;
    border-left: 3px solid #cc5200;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #cc5200;
  }

  .graph-container {
    background: rgba(20, 20, 20, 0.8);
    border-radius: 8px;
    padding: 1.5rem;
  }

  .graph-placeholder {
    height: 250px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #444;
    border-radius: 8px;
    color: #999;
  }
</style> 