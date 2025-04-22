<script>
  import Sidebar from "../components/Sidebar.svelte";
  import { onMount } from 'svelte';
  import { getStats } from '../services/stats.js';
  import { Bar } from 'svelte-chartjs';
  import 'chart.js/auto';
  import { socket } from '../services/socket.js';

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

    // Abonnement temps réel
    socket.subscribe(s => {
      if (!s) return;
      const refresh = async () => {
        try { stats = await getStats(); } catch(e) { console.error(e); }
      };
      s.on('map_generated', refresh);
      s.on('map_deleted', refresh);
    });
  });

  $: chartData = stats ? {
    labels: stats.monthly_activity.map(m => `${m.month}/${m.year.toString().slice(-2)}`),
    datasets: [{
      label: 'Cartes générées',
      backgroundColor: 'var(--accent)',
      data: stats.monthly_activity.map(m => m.count)
    }]
  } : null;
</script>

<Sidebar />

<main class="container">
  <section class="header">
    <h1>Statistiques</h1>
  </section>

  {#if loading}
    <div class="message loading"><p>Chargement...</p></div>
  {:else if error}
    <div class="message error"><p>{error}</p></div>
  {:else}
    <section class="stats-grid">
      <div class="stat-card">
        <h3>Cartes générées</h3>
        <p class="value">{stats.total_maps}</p>
      </div>
      <div class="stat-card">
        <h3>Distance totale</h3>
        <p class="value">{stats.total_distance} km</p>
      </div>
      <div class="stat-card">
        <h3>Cette semaine</h3>
        <p class="value">{stats.week_count}</p>
      </div>
      <div class="stat-card">
        <h3>Évolution hebdo</h3>
        <p class="value">{stats.weekly_growth === null ? 'N/A' : stats.weekly_growth.toFixed(1) + '%'}</p>
      </div>
    </section>

    <section class="chart-section">
      <h2>Activité mensuelle</h2>
      {#if chartData}
        <Bar {chartData} />
      {/if}
    </section>
  {/if}
</main>

<style>
  :root {
    --bg-dark: #000000;
    --bg-card: rgba(30,30,30,0.85);
    --accent: #cc5200;
    --text-light: #ffffff;
    --error-color: #f44336;
  }

  .container {
    margin-left: var(--sidebar-width);
    width: calc(100% - var(--sidebar-width));
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--bg-dark);
  }

  .header h1 {
    color: var(--text-light);
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .message {
    width: 100%;
    max-width: 900px;
    padding: 2rem;
    background: var(--bg-card);
    border: 1px solid var(--accent);
    border-radius: 12px;
    text-align: center;
  }

  .message.error p {
    color: var(--error-color);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    width: 100%;
    max-width: 900px;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: var(--bg-card);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    border-top: 4px solid var(--accent);
    text-align: center;
    transition: transform 0.2s;
  }

  .stat-card:hover {
    transform: translateY(-4px);
  }

  .stat-card h3 {
    color: var(--text-light);
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
  }

  .stat-card .value {
    font-size: 2rem;
    color: var(--accent);
    font-weight: bold;
  }

  .chart-section {
    width: 100%;
    max-width: 900px;
    background: var(--bg-card);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  }

  .chart-section h2 {
    color: var(--text-light);
    font-size: 1.75rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  /* Responsive adjustments */
  @media (max-width: 600px) {
    .header h1 {
      font-size: 2rem;
    }

    .stat-card .value {
      font-size: 1.75rem; 
    }
  }
</style>
