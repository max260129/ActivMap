<script>
	import { currentUser, logout } from '../services/auth';

	// Gestion du clic sur Déconnexion
	function handleLogout() {
		logout();
	}
</script>

<style>
	/* Barre latérale fixe sur toute la hauteur */
	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		height: 100vh;
		width: 240px;
		background: #111;
		color: #fff;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem 1rem;
		box-shadow: 4px 0 12px rgba(0,0,0,0.5);
		z-index: 150; /* Au‑dessus du contenu principal */
	}

	/* Profil */
	.avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid #cc5200;
		margin-bottom: 1rem;
	}

	.username {
		font-size: 1.2rem;
		font-weight: bold;
		margin: 0.5rem 0;
	}

	.email {
		font-size: 0.9rem;
		color: #ccc;
		word-break: break-all;
	}

	nav {
		margin-top: 2rem;
		width: 100%;
	}

	nav ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	nav a {
		color: #fff;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		transition: background 0.25s ease;
	}

	nav a:hover {
		background: rgba(204, 82, 0, 0.4);
	}

	.logout-btn {
		margin-top: auto; /* Coller en bas */
		background: #cc5200;
		border: none;
		border-radius: 4px;
		padding: 0.6rem 1rem;
		color: #fff;
		cursor: pointer;
		transition: background 0.25s ease;
	}

	.logout-btn:hover {
		background: #e2641a;
	}
</style>

<div class="sidebar">
	<!-- Image de profil : gravatar ou avatar par défaut -->
	<img class="avatar" src="https://www.gravatar.com/avatar/?d=identicon" alt="Avatar utilisateur" />

	<h2 class="username">{$currentUser?.username || 'Utilisateur'}</h2>
	<p class="email">{$currentUser?.email}</p>

	<nav>
		<ul>
			<li><a href="#carte">Générer une carte</a></li>
			<li><a href="#statistique">Statistique</a></li>
			<li><a href="#parametre">Paramètre</a></li>
			<li><a href="#equipe">Équipe</a></li>
			<li><a href="#historique">Historique</a></li>
		</ul>
	</nav>

	<button class="logout-btn" on:click={handleLogout}>Déconnexion</button>
</div> 