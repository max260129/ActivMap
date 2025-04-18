<script>
  import Sidebar from "../components/Sidebar.svelte";
  import { onMount } from 'svelte';
  import { getStats } from '../services/stats.js';
  import { Bar } from 'svelte-chartjs';
  import 'chart.js/auto';

  let stats = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      stats = await getStats();
    } catch(e) {
      console.error(e);
      error = e.message || 'Erreur chargement statistiques';
    } finally {
      loading = false;
    }
  });

  // Préparer les données du graphique lorsque stats est disponible
  $: chartData = stats ? {
    labels: stats.monthly_activity.map(m => `${m.month}/${m.year.toString().slice(-2)}`),
    datasets: [{
      label: 'Cartes générées',
      backgroundColor: '#cc5200',
      data: stats.monthly_activity.map(m => m.count)
    }]
  } : null;
</script>

<Sidebar />

<div class="content-auth">
  <div class="card">
    <h1>Statistiques</h1>

    {#if loading}
      <p style="text-align:center">Chargement...</p>
    {:else if error}
      <p style="text-align:center;color:red">{error}</p>
    {:else if stats}
      <div class="stats-container">
        <div class="stat-card">
          <h3>Cartes générées</h3>
          <p class="stat-value">{stats.total_maps}</p>
        </div>
        <div class="stat-card">
          <h3>Distance totale</h3>
          <p class="stat-value">{stats.total_distance} km</p>
        </div>
        <div class="stat-card">
          <h3>Cette semaine</h3>
          <p class="stat-value">{stats.week_count}</p>
        </div>
        <div class="stat-card">
          <h3>Évolution hebdo</h3>
          <p class="stat-value">{stats.weekly_growth === null ? 'N/A' : stats.weekly_growth.toFixed(1) + '%'}</p>
        </div>
      </div>

      <div class="graph-container">
        <h2>Activité mensuelle</h2>
        {#if chartData}
          <Bar {chartData} />
        {/if}
      </div>
    {/if}
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
    max-width: 900px;
  }

  h1, h2 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: #fff;
  }

  .stats-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: rgba(20, 20, 20, 0.8);
    border-radius: 8px;
    padding: 1.5rem;
    flex: 1 1 calc(50% - 1rem);
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