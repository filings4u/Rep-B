/**
 * filings4u shared Supabase browser client
 * Browser-safe publishable key only. Never place service_role here.
 */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://lrbimrlbskjweynxlgas.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RlmqwQM8ATOc7-ML9hvwgw_UljUEavh';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[filings4u] Supabase JS v2 must load before admin-supabase-client.js');
    return;
  }

  if (!window.filings4uSupabase) {
    window.filings4uSupabase = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'filings4u-admin-auth'
        }
      }
    );
  }

  window.filings4uAdminSupabase = window.filings4uSupabase;
  window.supabaseClient = window.filings4uSupabase;
  window.filings4uDb = window.filings4uSupabase;
  window.FILINGS4U_SUPABASE_URL = SUPABASE_URL;
  window.FILINGS4U_SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;
})();
