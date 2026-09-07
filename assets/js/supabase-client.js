(() => {
  'use strict';

  const SUPABASE_URL = 'https://lrbimrlbskjweynxlgas.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RlmqwQM8ATOc7-ML9hvwgw_UljUEavh';
  const STORAGE_KEY = 'filings4u-client-auth-v2';

  if (!window.supabase?.createClient) {
    console.error('Supabase JS failed to load.');
    return;
  }

  window.filings4uSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        storageKey: STORAGE_KEY,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  window.filings4uAuthRealm = 'client';
  window.filings4uAuthStorageKey = STORAGE_KEY;
})();
