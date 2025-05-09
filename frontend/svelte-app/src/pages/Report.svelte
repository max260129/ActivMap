<script>
  import Sidebar from '../components/Sidebar.svelte';
  import { sendReport } from '../services/report.js';
  import { t, locale } from '../i18n.js';
  let description = '';
  let files = [];
  let message = null;
  async function submit() {
    message = null;
    const res = await sendReport({ description, files });
    if (res.error) {
      message = { type: 'error', text: res.error };
    } else {
      message = { type: 'success', text: t('report_success', $locale) };
      description = '';
      files = [];
    }
  }
</script>

<div class="content-auth">
  <Sidebar />
  <h1>{t('report_title', $locale)}</h1>
  {#if message}
    <div class={message.type}>{message.text}</div>
  {/if}
  <form on:submit|preventDefault={submit}>
    <label>
      {t('report_description', $locale)} :
      <textarea bind:value={description} rows="6" required />
    </label>
    <label>
      {t('report_attachments', $locale)} :
      <input type="file" multiple on:change={e => files = Array.from(e.target.files)} />
    </label>
    <button type="submit">{t('submit', $locale)}</button>
  </form>
</div>

<style>
  .error { color: red; margin: 1rem 0; }
  .success { color: green; margin: 1rem 0; }
  form { display: flex; flex-direction: column; gap: 1rem; }
</style> 