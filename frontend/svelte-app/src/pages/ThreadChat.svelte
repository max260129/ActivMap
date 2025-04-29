<script>
  import { onMount, onDestroy } from 'svelte';
  import Sidebar from '../components/Sidebar.svelte';
  import { currentThread } from '../components/socketStore.js';
  import { fetchThread, sendMessage, deleteThread } from '../services/reportChat.js';
  import { socket } from '../services/socket.js';
  import { currentUser } from '../services/auth.js';
  import { t, locale } from '../i18n.js';
  import { derived, get } from 'svelte/store';

  // Récupérer tid depuis l'URL (#thread?tid=123)
  let tid = null;
  function parseTid(){
    const q = window.location.hash.split('?')[1] || '';
    const params = new URLSearchParams(q);
    tid = parseInt(params.get('tid')) || null;
  }
  parseTid();

  // Charger le thread
  let loading = true;
  let error = '';
  async function load(){
    loading = true; error='';
    try{
      const data = await fetchThread(tid);
      if(data.error){ error = data.error; }
      else{ currentThread.set(data); joinSocket(); }
    }catch(e){ error='Erreur serveur'; }
    loading = false;
  }

  // join room via socket
  function joinSocket(){
    const s = get(socket);
    if(s){ s.emit('join_thread', { thread_id: tid }); }
  }

  // gestion input
  let newMsg='';
  async function send(){
    if(!newMsg.trim()) return;
    await sendMessage(tid, newMsg.trim());
    newMsg='';
  }

  async function removeThread(){
    if(!confirm('Supprimer cette discussion ?')) return;
    await deleteThread(tid);
    location.hash = 'reports';
  }

  // écouter thread_deleted
  let unsubSocket;
  onMount(()=>{
    load();
    unsubSocket = socket.subscribe(s=>{}); // just keep reactive
  });
  onDestroy(()=>{ if(unsubSocket) unsubSocket(); });

  const messages = derived(currentThread, th=> th ? th.messages : []);
</script>

<Sidebar />
<div class="content-auth">
  {#if loading}
    <p>{t('loading',$locale)}...</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    {#if $currentThread}
      <h2>Ticket #{ $currentThread.report_id }</h2>
      <div class="messages">
        {#each $currentThread.messages as m}
          <div class="msg {m.sender_id === $currentUser.id ? 'me' : 'other'}">
            <div class="body">{m.body}</div>
            <div class="meta">{new Date(m.created_at).toLocaleString()}</div>
          </div>
        {/each}
      </div>
      {#if $currentUser.role === 'ADMIN'}
        <button class="danger" on:click={removeThread}>🗑 Fermer la discussion</button>
      {/if}
      <div class="composer">
        <textarea bind:value={newMsg}></textarea>
        <button on:click={send}>{t('submit',$locale)}</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .messages{max-width:600px;width:100%;display:flex;flex-direction:column;gap:.5rem;margin-bottom:1rem;}
  .msg{padding:.5rem 1rem;border-radius:8px;max-width:80%;}
  .me{align-self:flex-end;background:#cc5200;color:#fff;}
  .other{align-self:flex-start;background:#333;color:#fff;}
  .composer{display:flex;flex-direction:column;gap:.5rem;max-width:600px;width:100%;}
  textarea{min-height:60px;padding:.5rem;}
  .error{color:red;}
  .danger{background:#a00;color:#fff;padding:.5rem 1rem;border:none;border-radius:6px;margin-bottom:1rem;align-self:flex-end;}
</style> 