<script>
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  let content = '';
  let container;

  onMount(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/legal/privacy');
      const data = await res.json();
      content = marked.parse(data.content);
    } catch (e) {
      content = '<p>Impossible de charger la politique de confidentialité.</p>';
    }
  });
</script>

<style>
  .policy-container {
    max-width: 800px;
    margin: 2rem auto;
    background: rgba(0,0,0,0.8);
    padding: 2rem;
    border-radius: 8px;
    color: #fff;
  }
  :global(body.theme-light) .policy-container {
    background: #fff;
    color: #000;
  }
</style>

<div class="policy-container" bind:this={container}>
  {@html content}
</div> 