<script>
  import Sidebar from "../components/Sidebar.svelte";
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { fetchWithAuth, currentUser } from '../services/auth.js';
  import { socket } from '../services/socket.js';
  
  let teamMembers = [];
  let loading = false;
  let error = '';
  
  // Formulaire
  let inviteEmail = '';
  let inviteRole = 'EMPLOYE';
  
  const roleLabels = {
    'ADMIN': 'Administrateur',
    'CHEF': 'Chef de projet',
    'EMPLOYE': 'Employé'
  };
  
  async function loadMembers() {
    loading = true;
    const resp = await fetchWithAuth('/team/', { method: 'GET' });
    if (resp.ok) {
      const data = await resp.json();
      teamMembers = data.users;
    } else {
      error = (await resp.json()).error || 'Erreur de chargement';
    }
    loading = false;
  }
  
  onMount(() => {
    loadMembers();

    // Abonnement socket pour mise à jour temps réel
    socket.subscribe(s => {
      if (!s) return;
      s.on('team_member_invited', (payload) => {
        teamMembers = [...teamMembers, payload];
      });
      s.on('team_member_joined', (payload) => {
        teamMembers = teamMembers.map(m => m.id === payload.id ? payload : m);
      });
    });
  });
  
  // Redirection si non admin
  onMount(() => {
    if ($currentUser?.role !== 'ADMIN') {
      window.location.hash = '#carte';
    }
  });
  
  async function sendInvite() {
    if (!inviteEmail) return;
    const resp = await fetchWithAuth('/team/', {
      method: 'POST',
      body: JSON.stringify({ email: inviteEmail, role: inviteRole })
    });
    if (resp.ok) {
      inviteEmail = '';
      inviteRole = 'EMPLOYE';
      const { user } = await resp.json();
      teamMembers = [...teamMembers, user];
    } else {
      error = (await resp.json()).error;
    }
  }
  
  async function changeRole(member, newRole) {
    const resp = await fetchWithAuth(`/team/${member.id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    });
    if (resp.ok) {
      const { user } = await resp.json();
      teamMembers = teamMembers.map(m => m.id === user.id ? user : m);
    }
  }
  
  async function removeMember(id) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    const resp = await fetchWithAuth(`/team/${id}`, { method: 'DELETE' });
    if (resp.ok) {
      teamMembers = teamMembers.filter(m => m.id !== id);
    }
  }
</script>

<Sidebar />

<div class="content-auth" transition:fly={{ y: 20, duration: 600 }}>
  <div class="team-page">
    <div class="header-section">
      <h1>Notre équipe</h1>
      <p class="subtitle">Découvrez les personnes qui travaillent avec vous</p>
    </div>
    
    <div class="team-grid">
      {#each teamMembers as member}
        <div class="team-card">
          <img src={member.avatar || 'https://www.gravatar.com/avatar/?d=identicon'} alt="Avatar de {member.email}" class="member-avatar">
          <h3>{member.username || member.email}</h3>
          <p class="member-role">{roleLabels[member.role]}</p>
          {#if member.invite_pending}
            <p class="member-status">Invitation envoyée</p>
          {:else}
            <p class="member-status success">Rejoint ✔</p>
          {/if}
          <p class="member-email">{member.email}</p>
          <div class="member-footer">
            <select bind:value={member.role} on:change={(e)=>changeRole(member, e.target.value)} disabled={member.id === $currentUser?.id}>
              {#each Object.keys(roleLabels) as r}
                <option value={r} disabled={r==='ADMIN' && member.role!=='ADMIN' && teamMembers.some(u=>u.role==='ADMIN')} >{roleLabels[r]}</option>
              {/each}
            </select>
            <button class="btn-contact" on:click={()=>removeMember(member.id)} disabled={member.id === $currentUser?.id}>Supprimer</button>
          </div>
        </div>
      {/each}
    </div>
    
    <div class="invite-section">
      <h2>Inviter un nouveau membre</h2>
      <div class="invite-form">
        <div class="form-group">
          <label for="inviteEmail">Email</label>
          <input type="email" id="inviteEmail" bind:value={inviteEmail} placeholder="email@exemple.com" />
        </div>
        <div class="form-group">
          <label for="inviteRole">Rôle</label>
          <select id="inviteRole" bind:value={inviteRole}>
            {#each Object.keys(roleLabels) as r}
              <option value={r}>{roleLabels[r]}</option>
            {/each}
          </select>
        </div>
        <button class="btn-invite" on:click={sendInvite}>Envoyer une invitation</button>
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

  .team-page {
    width: 100%;
    max-width: 1200px;
  }

  .header-section {
    text-align: center;
    margin-bottom: 3rem;
  }

  h1 {
    color: #fff;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #ccc;
    font-size: 1.1rem;
  }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .team-card {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid #cc5200;
    border-radius: 12px;
    overflow: hidden;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: 0 8px 20px rgba(204, 82, 0, 0.3);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .team-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 25px rgba(204, 82, 0, 0.4);
  }

  .member-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 3px solid #cc5200;
    object-fit: cover;
    margin-bottom: 1rem;
  }

  h3 {
    color: #fff;
    margin: 0.5rem 0;
    font-size: 1.2rem;
  }

  .member-role {
    color: #cc5200;
    font-weight: bold;
    margin: 0.2rem 0;
  }

  .member-email {
    color: #ccc;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .member-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid #333;
  }

  .joined {
    color: #999;
    font-size: 0.85rem;
  }

  .btn-contact {
    background: transparent;
    color: #cc5200;
    border: 1px solid #cc5200;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-contact:hover {
    background: rgba(204, 82, 0, 0.2);
  }

  .invite-section {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid #cc5200;
    border-radius: 12px;
    padding: 2rem;
    margin-top: 2rem;
  }

  h2 {
    color: #fff;
    margin-bottom: 1.5rem;
    font-size: 1.3rem;
    text-align: center;
  }

  .invite-form {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 1rem;
    align-items: flex-end;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  label {
    color: #ccc;
    margin-bottom: 0.5rem;
  }

  input, select {
    padding: 0.75rem;
    border: 1px solid #444;
    border-radius: 4px;
    background: #222;
    color: #fff;
  }

  .btn-invite {
    background: #cc5200;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    font-weight: bold;
    transition: background 0.2s;
  }

  .btn-invite:hover {
    background: #e05a00;
  }

  @media (max-width: 768px) {
    .invite-form {
      grid-template-columns: 1fr;
    }
  }
</style> 