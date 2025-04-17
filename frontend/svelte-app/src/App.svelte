<script>
	import { fade, fly, scale as scaleTransition } from 'svelte/transition';
	import { onMount } from 'svelte';
	import Login from './components/Login.svelte';
	import Sidebar from './components/Sidebar.svelte';
	import { isAuthenticated, currentUser, checkAuth, logout, fetchWithAuth } from './services/auth';

	// Configuration du backend
	const API_URL = 'http://localhost:5000';
	
	// État d'authentification forcé à false au démarrage
	$: console.log("État d'authentification:", $isAuthenticated);
	
	let latitude = 49.444838;
	let longitude = 1.094214;
	let distance = 150;
	let svgUrl = "";
	let loading = false;
	let error = "";
	let scale = 1.0;
	const minScale = 0.5;
	const maxScale = 3.0;
	let rotate = 0; // Angle de rotation en degrés
	// Flag pour utiliser l'endpoint public (non-protégé)
	let usePublicEndpoint = false;
  
	// Variables pour le panning
	let translateX = 0;
	let translateY = 0;
	let isDragging = false;
	let initialDragX = 0;
	let initialDragY = 0;
	let initialTranslateX = 0;
	let initialTranslateY = 0;
  
	// Transformation combinée : translation, rotation et zoom
	$: transformValue = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scale})`;
  
	// Vérifier l'authentification au démarrage
	onMount(() => {
		// Vérifier l'authentification sans forcer la déconnexion
		checkAuth();
	});

	async function generateMap() {
		loading = true;
		error = "";
		svgUrl = "";
		// Réinitialise zoom, rotation et panning
		scale = 1.0;
		rotate = 0;
		translateX = 0;
		translateY = 0;
		try {
			// Choisir l'endpoint en fonction du flag
			const endpoint = usePublicEndpoint ? `${API_URL}/generate-public` : `${API_URL}/generate-map`;
			console.log("Endpoint utilisé:", endpoint);
			
			const response = await fetchWithAuth(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ latitude, longitude, distance })
			});
			if (!response.ok) {
				if (response.status === 401) {
					error = "Vous devez être connecté pour générer une carte.";
					$isAuthenticated = false;
				} else {
					const errData = await response.json();
					error = errData.error || "Erreur lors de la génération de la carte.";
				}
			} else {
				const blob = await response.blob();
				svgUrl = URL.createObjectURL(blob);
			}
		} catch (err) {
			error = "Erreur réseau : " + err;
		} finally {
			loading = false;
		}
	}
  
	function handleWheel(e) {
		e.preventDefault();
		if (e.deltaY < 0) {
			scale = Math.min(maxScale, scale * 1.1);
		} else {
			scale = Math.max(minScale, scale / 1.1);
		}
	}
  
	function zoomIn() {
		scale = Math.min(maxScale, scale * 1.1);
	}
  
	function zoomOut() {
		scale = Math.max(minScale, scale / 1.1);
	}
  
	// Incrémente la rotation de 15 degrés à chaque clic
	function rotateMap() {
		rotate = rotate + 15;
	}
  
	function startDrag(e) {
		isDragging = true;
		initialDragX = e.clientX;
		initialDragY = e.clientY;
		initialTranslateX = translateX;
		initialTranslateY = translateY;
	}
  
	function drag(e) {
		if (isDragging) {
			const dx = e.clientX - initialDragX;
			const dy = e.clientY - initialDragY;
			translateX = initialTranslateX + dx;
			translateY = initialTranslateY + dy;
		}
	}
  
	function endDrag() {
		isDragging = false;
	}

	function handleLogout() {
		logout();
		svgUrl = "";
	}

	function handleLoginSuccess() {
		// Rafraîchir l'état d'authentification
		checkAuth();
	}
</script>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		/* Fond en full black */
		background: #000;
		color: #fff;
		font-family: 'Roboto', sans-serif;
	}
  
	main {
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
		max-width: 600px;
		margin-bottom: 2rem;
		overflow: hidden;
		position: relative;
	}
  
	h1, h2 {
		text-align: center;
		margin-bottom: 1rem;
		text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
	}
  
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
  
	label {
		display: flex;
		flex-direction: column;
		font-size: 1rem;
	}
  
	input {
		padding: 0.5rem;
		border: 1px solid #444;
		border-radius: 4px;
		background: #222;
		color: #fff;
		transition: border-color 0.3s ease;
	}
  
	input:focus {
		border-color: #cc5200;
		outline: none;
	}
  
	button {
		padding: 0.75rem;
		background-color: #cc5200;
		color: #fff;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}
  
	button:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 15px rgba(204, 82, 0, 0.5);
	}
  
	.loading-spinner {
		border: 4px solid rgba(255, 255, 255, 0.3);
		border-top: 4px solid #cc5200;
		border-radius: 50%;
		width: 50px;
		height: 50px;
		animation: spin 1s linear infinite;
		margin: 1rem auto;
	}
  
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
  
	.error {
		color: #ff4444;
		text-align: center;
		margin-top: 1rem;
	}
  
	/* Conteneur fixe pour la carte avec overflow hidden */
	.svg-container {
		width: 100%;
		max-width: 800px;
		height: 600px;
		position: relative;
		overflow: hidden;
		background-color: #000;
		border: 2px solid #cc5200;
		box-shadow: 0 8px 20px rgba(204, 82, 0, 0.5);
		cursor: grab;
		border-radius: 8px;
	}
  
	.svg-container:active {
		cursor: grabbing;
	}
  
	/* Boutons de zoom et rotation en premier plan */
	.zoom-controls {
		position: absolute;
		top: 10px;
		right: 10px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		z-index: 100;
		opacity: 0;
		animation: fadeInControls 1s forwards;
	}
  
	@keyframes fadeInControls {
		to { opacity: 1; }
	}
  
	.zoom-controls button {
		width: 45px;
		height: 45px;
		font-size: 1.2rem;
		padding: 0;
		border-radius: 50%;
		background-color: rgba(204, 82, 0, 0.7);
	}
  
	.zoom-controls button:hover {
		background-color: rgba(204, 82, 0, 0.8);
	}
  
	/* Style de l'image : centrée avec transformation dynamique */
	.svg-container img {
		position: absolute;
		top: 50%;
		left: 50%;
		transform-origin: center center;
		transition: transform 0.4s ease;
		max-width: none;
		z-index: 1;
		user-select: none;
		pointer-events: none;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.7));
	}

	/* Style pour le bouton de téléchargement */
	.download-container {
		text-align: center;
		margin: 1rem 0;
	}

	.checkbox-label {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: #ccc;
	}
	
	.checkbox-label input[type="checkbox"] {
		width: auto;
		margin: 0;
	}

	/* Contenu principal décalé pour la sidebar */
	.content-auth {
		margin-left: 240px; /* largeur de la sidebar */
		width: calc(100% - 240px);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		gap: 2rem;
	}
</style>
  
<main>
	{#if $isAuthenticated}
		<!-- Sidebar de navigation -->
		<Sidebar />

		<div class="content-auth">
		<div id="carte" class="card" transition:fly={{ y: -20, duration: 600 }}>
			<h1>Générateur de carte stylisée</h1>
			<form on:submit|preventDefault={generateMap}>
				<label>
					Latitude :
					<input type="number" bind:value={latitude} step="0.000001" required />
				</label>
				<label>
					Longitude :
					<input type="number" bind:value={longitude} step="0.000001" required />
				</label>
				<label>
					Distance (m) :
					<input type="number" bind:value={distance} required />
				</label>
				
				<button type="submit">Générer la carte</button>
			</form>
			{#if loading}
				<div class="loading-spinner"></div>
				<p style="text-align: center;">Génération en cours...</p>
			{/if}
			{#if error}
				<p class="error">{error}</p>
			{/if}
		</div>
		
		{#if svgUrl}
			<h2 transition:fade style="text-align: center;">Carte générée :</h2>
			<div class="card" transition:fly={{ y: 20, duration: 600 }}>
				<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
				<div
					class="svg-container"
					role="application"
					aria-label="Carte stylisée"
					on:wheel|preventDefault={handleWheel}
					on:mousedown={startDrag}
					on:mousemove={drag}
					on:mouseup={endDrag}
					on:mouseleave={endDrag}
				>
					<div class="zoom-controls">
						<button on:click={zoomIn} aria-label="Zoom In">+</button>
						<button on:click={zoomOut} aria-label="Zoom Out">–</button>
						<button on:click={rotateMap} aria-label="Rotate">⟳</button>
					</div>
					<img src={svgUrl} alt="Carte stylisée" style:transform={transformValue} transition:scaleTransition={{ duration: 400 }}/>
				</div>
			</div>
			<div class="download-container">
				<a download="carte.svg" href={svgUrl}>
					<button>Télécharger l'image SVG</button>
				</a>
			</div>
		{/if}
		</div> <!-- fin content-auth -->
	{:else}
		<!-- Page de connexion -->
		<div class="card" transition:fly={{ y: -20, duration: 600 }}>
			<h1>ActivMap</h1>
			<Login on:login-success={handleLoginSuccess} />
		</div>
	{/if}
</main>
