<script>
  import Sidebar from "../components/Sidebar.svelte";
  import { fly } from 'svelte/transition';
  
  // Données factices pour les membres de l'équipe
  const teamMembers = [
    {
      id: 1,
      name: "Maxence Dupont",
      role: "Chef de projet",
      avatar: "https://www.gravatar.com/avatar/1?d=identicon",
      email: "maxence@activmap.fr",
      joined: "2022"
    },
    {
      id: 2,
      name: "Sophie Martin",
      role: "Développeuse frontend",
      avatar: "https://www.gravatar.com/avatar/2?d=identicon",
      email: "sophie@activmap.fr",
      joined: "2023"
    },
    {
      id: 3,
      name: "Lucas Bernard",
      role: "Développeur backend",
      avatar: "https://www.gravatar.com/avatar/3?d=identicon",
      email: "lucas@activmap.fr",
      joined: "2022"
    },
    {
      id: 4,
      name: "Emma Petit",
      role: "Graphiste UI/UX",
      avatar: "https://www.gravatar.com/avatar/4?d=identicon",
      email: "emma@activmap.fr",
      joined: "2023"
    }
  ];
  
  // État pour le formulaire d'invitation
  let inviteEmail = "";
  let inviteRole = "Membre";
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
          <img src={member.avatar} alt="Avatar de {member.name}" class="member-avatar">
          <h3>{member.name}</h3>
          <p class="member-role">{member.role}</p>
          <p class="member-email">{member.email}</p>
          <div class="member-footer">
            <span class="joined">Depuis {member.joined}</span>
            <button class="btn-contact">Contact</button>
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
            <option value="Membre">Membre</option>
            <option value="Administrateur">Administrateur</option>
            <option value="Éditeur">Éditeur</option>
            <option value="Visualiseur">Visualiseur</option>
          </select>
        </div>
        <button class="btn-invite">Envoyer une invitation</button>
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