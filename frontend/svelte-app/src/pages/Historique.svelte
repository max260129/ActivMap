<script>
  import Sidebar from "../components/Sidebar.svelte";
  import { onMount } from 'svelte';
  import { getHistory, deleteHistory, regenerateHistory, fetchFile } from '../services/history.js';
  
  let historyItems = [];
  let loading = true;

  async function loadHistory() {
    try {
      const data = await getHistory();
      // Téléchargement des blobs en parallèle
      const itemsWithMeta = data.items.map((it) => ({
        id: it.id,
        date: new Date(it.created_at).toLocaleString(),
        location: `${it.latitude.toFixed(4)}, ${it.longitude.toFixed(4)}`,
        coordinates: `${it.latitude}, ${it.longitude}`,
        distance: it.distance,
      }));

      // Récupérer les blobs protégés
      historyItems = await Promise.all(
        itemsWithMeta.map(async (el) => {
          try {
            el.blobUrl = await fetchFile(el.id);
          } catch (e) {
            console.error('Erreur fetchFile', e);
            el.blobUrl = '';
          }
          return el;
        })
      );
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  onMount(loadHistory);

  async function handleDelete(id) {
    await deleteHistory(id);
    historyItems = historyItems.filter((h) => h.id !== id);
  }

  async function handleRegenerate(id) {
    await regenerateHistory(id);
    loadHistory();
  }
  
  // État pour les filtres
  let searchQuery = "";
  let sortOrder = "newest";
  
  // Filtrer et trier l'historique
  $: filteredHistory = historyItems
    .filter(item => 
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.coordinates.includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.date) - new Date(a.date);
      } else {
        return new Date(a.date) - new Date(b.date);
      }
    });
</script>

<Sidebar />

<div class="content-auth">
  <div class="history-page">
    <div class="header-section">
      <h1>Historique des cartes</h1>
      <p class="subtitle">Retrouvez toutes vos cartes générées précédemment</p>
    </div>
    
    <div class="filters">
      <div class="search-bar">
        <input 
          type="text" 
          placeholder="Rechercher par lieu ou coordonnées" 
          bind:value={searchQuery}
        />
        <button class="search-button">
          <span class="search-icon">🔍</span>
        </button>
      </div>
      
      <div class="sort-controls">
        <label for="sortOrder">Trier par :</label>
        <select id="sortOrder" bind:value={sortOrder}>
          <option value="newest">Plus récent</option>
          <option value="oldest">Plus ancien</option>
        </select>
      </div>
    </div>
    
    <div class="history-list">
      {#if filteredHistory.length > 0}
        {#each filteredHistory as item}
          <div class="history-item">
            <img src={item.blobUrl} alt="Miniature de la carte" class="history-thumbnail" />
            <div class="history-details">
              <h3>{item.location}</h3>
              <p class="coordinates">Coordonnées: {item.coordinates}</p>
              <p class="meta-info">
                <span class="date">Généré le: {item.date}</span>
                <span class="distance">Distance: {item.distance}m</span>
              </p>
            </div>
            <div class="history-actions">
              <button class="btn-view" on:click={() => window.open(item.blobUrl, '_blank')}>Voir</button>
              <button class="btn-regenerate" on:click={() => handleRegenerate(item.id)}>Regénérer</button>
              <button class="btn-delete" on:click={() => handleDelete(item.id)}>Supprimer</button>
            </div>
          </div>
        {/each}
      {:else}
        <div class="empty-state">
          <p>Aucun résultat trouvé pour votre recherche.</p>
        </div>
      {/if}
    </div>
    
    <div class="pagination">
      <button class="page-btn">«</button>
      <button class="page-btn active">1</button>
      <button class="page-btn">2</button>
      <button class="page-btn">3</button>
      <button class="page-btn">»</button>
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

  .history-page {
    width: 100%;
    max-width: 1000px;
  }

  .header-section {
    text-align: center;
    margin-bottom: 2rem;
  }

  h1 {
    color: #fff;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #ccc;
  }

  .filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .search-bar {
    position: relative;
    flex: 1;
    max-width: 500px;
  }

  .search-bar input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 1rem;
    border: 1px solid #444;
    border-radius: 8px;
    background: #222;
    color: #fff;
  }

  .search-button {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #cc5200;
    cursor: pointer;
    font-size: 1.2rem;
  }

  .sort-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sort-controls label {
    color: #ccc;
  }

  .sort-controls select {
    padding: 0.5rem;
    border: 1px solid #444;
    border-radius: 6px;
    background: #222;
    color: #fff;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .history-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid #333;
    border-radius: 8px;
    transition: transform 0.2s, border-color 0.2s;
  }

  .history-item:hover {
    transform: translateY(-2px);
    border-color: #cc5200;
  }

  .history-thumbnail {
    width: 80px;
    height: 80px;
    border-radius: 6px;
    object-fit: cover;
    margin-right: 1rem;
    border: 1px solid #444;
  }

  .history-details {
    flex: 1;
  }

  .history-details h3 {
    margin: 0 0 0.5rem 0;
    color: #fff;
  }

  .coordinates {
    color: #ccc;
    margin: 0.2rem 0;
    font-size: 0.9rem;
  }

  .meta-info {
    display: flex;
    gap: 1rem;
    color: #999;
    font-size: 0.85rem;
    margin: 0.5rem 0 0 0;
  }

  .history-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .history-actions button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
  }

  .btn-view {
    background: #444;
    color: white;
  }

  .btn-regenerate {
    background: #cc5200;
    color: white;
  }

  .btn-delete {
    background: transparent;
    border: 1px solid #cc5200;
    color: #cc5200;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #999;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 8px;
  }

  .pagination {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 2rem;
  }

  .page-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #444;
    background: #222;
    color: #ccc;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }

  .page-btn:hover {
    border-color: #cc5200;
    color: white;
  }

  .page-btn.active {
    background: #cc5200;
    border-color: #cc5200;
    color: white;
  }

  @media (max-width: 768px) {
    .filters {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    
    .history-item {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .history-thumbnail {
      margin-bottom: 1rem;
      margin-right: 0;
      width: 100%;
      height: 150px;
    }
    
    .history-actions {
      flex-direction: row;
      width: 100%;
      margin-top: 1rem;
    }
    
    .history-actions button {
      flex: 1;
    }
  }
</style> 