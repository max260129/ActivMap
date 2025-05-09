<script lang="ts">
	import { currentUser, logout } from "../services/auth";
	import { t } from "../i18n.js";
  
	/**
	 * Menu configuration – easier to maintain
	 */
	const rawMenu = [
	  { id: "carte", label: () => t('sidebar_map'), show: role => true },
	  { id: "statistique", label: () => t('sidebar_stats'), show: role => role !== 'EMPLOYE' },
	  { id: "parametre", label: () => t('sidebar_settings'), show: role => true },
	  { id: "equipe", label: () => t('sidebar_team'), show: role => role === 'ADMIN' },
	  { id: "historique", label: () => t('sidebar_history'), show: role => true },
	  { id: "report", label: () => t('sidebar_report'), show: role => true },
	  { id: "reports", label: () => t('sidebar_reports'), show: role => true }
	];
  
	$: userRole = ($currentUser)?.role || 'EMPLOYE';
	$: menu = rawMenu.filter(item => item.show(userRole));
  
	// Identifier la page active via le hash
	let activeId = window.location.hash.replace('#', '').split('?')[0] || 'carte';
  
	function updateActive() {
	  activeId = window.location.hash.replace('#', '').split('?')[0] || 'carte';
	}
  
	// Mettre à jour lors du changement de hash
	window.addEventListener('hashchange', updateActive);
	// Nettoyer lors de la destruction du composant
	import { onDestroy } from 'svelte';
	onDestroy(() => window.removeEventListener('hashchange', updateActive));
  
	function handleLogout() {
	  logout();
	}
  </script>
  
  <aside class="sidebar">
	<!-- PROFILE -->
	<section class="profile">
	  <img
		class="avatar"
		src="https://www.gravatar.com/avatar/?d=identicon"
		alt="Avatar utilisateur"
	  />
	  <div class="user-info">
		<h2 class="username">{($currentUser)?.username || "Utilisateur"}</h2>
		<p class="email">{($currentUser)?.email}</p>
	  </div>
	</section>
  
	<!-- MENU -->
	<nav class="menu" aria-label="Navigation principale">
	  {#each menu as item (item.id)}
		<a
		  href={`#${item.id}`}
		  class="menu-item"
		  aria-current={item.id === activeId ? 'page' : undefined}
		>
		  {item.label()}
		</a>
	  {/each}
	</nav>
  
	<!-- LOGOUT BUTTON -->
	<button class="logout" on:click={handleLogout}>{t('logout')}</button>
  </aside>
  
  <style>
	:global(:root) {
	  /* Theme */
	  --sidebar-width: 256px;
	  --sidebar-bg: #111;
	  --accent-color: #cc5200;
	  --text-light: #fff;
	  --text-muted: #ccc;
  
	  /* Spacing & layout */
	  --radius-md: 6px;
	  --transition-fast: 0.2s ease;
	}
  
	/* SIDEBAR WRAPPER */
	.sidebar {
	  position: fixed;
	  inset: 0 auto 0 0; /* top & left locked */
	  width: var(--sidebar-width);
	  height: 100vh;
	  padding: 2rem 1.5rem;
  
	  display: flex;
	  flex-direction: column;
	  gap: 2.5rem;
  
	  background: var(--sidebar-bg);
	  color: var(--text-light);
	  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.5);
	  z-index: 150;
	}
  
	/* PROFILE SECTION */
	.profile {
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	  gap: 0.75rem;
	}
  
	.avatar {
	  width: 88px;
	  height: 88px;
	  border-radius: 50%;
	  border: 3px solid var(--accent-color);
	  object-fit: cover;
	}
  
	.username {
	  font-size: 1.3rem;
	  margin: 0;
	  text-align: center;
	  word-break: break-word;
	}
  
	.email {
	  font-size: 0.85rem;
	  color: var(--text-muted);
	  margin: 0;
	  text-align: center;
	  word-break: break-all;
	}
  
	/* MENU SECTION */
	.menu {
	  flex: 1 1 auto;
	  display: flex;
	  flex-direction: column;
	  gap: 1rem; /* more vertical spacing between items */
	}
  
	.menu-item {
	  display: block;
	  width: 100%;
	  padding: 0.85rem 1rem;
  
	  color: var(--text-light);
	  text-decoration: none;
	  font-size: 0.95rem;
  
	  border-left: 4px solid transparent;
	  border-radius: var(--radius-md);
	  transition: background var(--transition-fast), border-color var(--transition-fast);
	}
  
	.menu-item:hover,
	.menu-item:focus-visible {
	  background: rgba(204, 82, 0, 0.35);
	  border-left-color: var(--accent-color);
	  outline: none;
	}
  
	/* Active state via :target (optional) */
	:global(:target) ~ main .menu-item[href$=":target"] {
	  border-left-color: var(--accent-color);
	}
  
	/* LOGOUT BUTTON */ 
	.logout {
	  background: var(--accent-color);
	  border: none;
	  border-radius: var(--radius-md);
	  padding: 0.9rem 1.5rem;
  
	  color: var(--text-light);
	  font-weight: 600;
	  cursor: pointer;
	  transition: background var(--transition-fast), transform var(--transition-fast);
	}
  
	.logout:hover {
	  background: #e2641a;
	  transform: translateY(-2px);
	}
  
	.logout:active {
	  transform: translateY(0);
	}
  </style>
  