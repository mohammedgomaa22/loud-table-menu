(function initSupabaseClient() {
  if (!window.MMC_SUPABASE_CONFIG) {
    console.error('MMC_SUPABASE_CONFIG is missing. Copy supabase-config.example.js to supabase-config.js');
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase JS library is not loaded.');
    return;
  }

  const { url, anonKey } = window.MMC_SUPABASE_CONFIG;
  window.mmcSupabase = window.supabase.createClient(url, anonKey);
})();
