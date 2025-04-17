<script>
	import { currentUser, logout } from '../services/auth';

	// Gestion du clic sur Déconnexion
	function handleLogout() {
		logout();
	}
</script>

<aside class="sidebar">
	<section class="profile">
		<img class="avatar" src="https://www.gravatar.com/avatar/?d=identicon" alt="Avatar utilisateur" />
		<div class="user-info">
			<h2>{$currentUser?.username || 'Utilisateur'}</h2>
			<p>{$currentUser?.email}</p>
		</div>
	</section>

	<nav class="menu">
		<ul>
			<li><a href="#carte">Générer une carte</a></li>
			<li><a href="#statistique">Statistique</a></li>
			<li><a href="#parametre">Paramètre</a></li>
			<li><a href="#equipe">Équipe</a></li>
			<li><a href="#historique">Historique</a></li>
		</ul>
	</nav>

	<button class="logout" on:click={handleLogout}>Déconnexion</button>
</aside>

<style>
:global(:root) {
	--sidebar-width: 240px;
	--sidebar-bg: #111;
	--accent-color: #cc5200;
	--text-light: #fff;
	--text-muted: #ccc;
}

.sidebar {
	position: fixed;
	top: 0;
	left: 0;
	height: 100vh;
	width: var(--sidebar-width);
	background-color: var(--sidebar-bg);
	color: var(--text-light);
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	padding: 1.5rem;
	box-shadow: 4px 0 12px rgba(0, 0, 0, 0.5);
	z-index: 150;
}

.profile {
	text-align: center;
	margin-bottom: 2rem;
}

.avatar {
	width: 80px;
	height: 80px;
	border-radius: 50%;
	object-fit: cover;
	border: 2px solid var(--accent-color);
	margin-bottom: 0.75rem;
}

.user-info h2 {
	font-size: 1.25rem;
	margin: 0;
}

.user-info p {
	font-size: 0.9rem;
	color: var(--text-muted);
	margin: 0.25rem 0 0;
	word-break: break-all;
}

.menu ul {
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.menu a {
	color: var(--text-light);
	text-decoration: none;
	padding: 0.75rem 1rem;
	border-radius: 4px;
	transition: background 0.25s ease;
}

.menu a:hover {
	background-color: rgba(204, 82, 0, 0.4);
}

.logout {
	align-self: center;
	background-color: var(--accent-color);
	border: none;
	border-radius: 4px;
	padding: 0.75rem 1.5rem;
	color: var(--text-light);
	cursor: pointer;
	transition: background-color 0.25s ease;
}

.logout:hover {
	background-color: #e2641a;
}
</style> 