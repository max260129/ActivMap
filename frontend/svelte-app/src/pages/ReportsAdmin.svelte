<script>
  import Sidebar from '../components/Sidebar.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { fetchReports } from '../services/report.js';
  import { t, locale } from '../i18n.js';
  import { API_URL } from '../services/constants.js';
  import { socket } from '../services/socket.js';
  import { deleteThread } from '../services/reportChat.js';

  let reports = [];
  let loading = true;
  let socketInstance;

  async function loadReports() {
    loading = true;
    try {
      const data = await fetchReports();
      if (!data.error) {
        reports = data;
      }
    } catch (e) {
      console.error('Erreur chargement signalements', e);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadReports();
    socketInstance = socket.subscribe(s => {
      if (!s) return;
      s.on('new_report', report => {
        reports = [report, ...reports];
      });
    });
  });
  onDestroy(() => {
    if (socketInstance) socketInstance();
  });
</script>

<div class="content-auth">
  <Sidebar />
  <h1>{t('reports_admin_title', $locale)}</h1>

  {#if loading}
    <p>{t('loading', $locale)}…</p>
  {:else if reports.length === 0}
    <p>{t('reports_empty', $locale)}</p>
  {:else}
    <ul class="report-list">
      {#each reports as r}
        <li class="report-item" on:click={() => r.thread_id && (location.hash = `thread?tid=${r.thread_id}`)}>
          <div class="report-meta">
            <strong>Utilisateur {r.user_id}</strong> • {new Date(r.created_at).toLocaleString($locale)}
          </div>
          <p class="report-desc">{r.description}</p>
          {#if r.attachments.length}
            <div class="report-attachments">
              {#each r.attachments as file}
                <a href={`${API_URL}/api/report/attachments/${file}`} target="_blank">
                  📎 {file}
                </a>
              {/each}
            </div>
          {/if}
          {#if r.thread_id != null}
            <button class="delete-btn" on:click|stopPropagation={async () => {
              if (confirm(t('confirm_delete_thread', $locale))) {
                try {
                  await deleteThread(r.thread_id);
                  reports = reports.filter(item => item.thread_id !== r.thread_id);
                } catch (e) {
                  console.error(e);
                  alert(t('delete_error', $locale));
                }
              }
            }}>
              {t('delete', $locale)}
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .report-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .report-item {
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  .report-meta {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    color: #ccc;
  }
  .report-desc {
    margin-bottom: 0.75rem;
  }
  .report-attachments a {
    margin-right: 0.5rem;
    color: #cc5200;
    text-decoration: none;
  }
  .report-attachments a:hover {
    text-decoration: underline;
  }
  .delete-btn {
    background: #e63946;
    border: none;
    color: #fff;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
  .delete-btn:hover {
    background: #d62828;
  }
</style> 