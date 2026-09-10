/**
 * filings4u management authentication guard.
 * Database RLS remains the authorization boundary for management data.
 */
(function () {
  'use strict';

  function client() {
    return window.filings4uSupabase || window.supabaseClient || window.filings4uDb || null;
  }

  function loginUrl() {
    const returnTo =
      window.location.pathname.split('/').pop() +
      window.location.search +
      window.location.hash;
    return 'admin-login.html?returnTo=' + encodeURIComponent(returnTo);
  }

  window.filings4uRequireAdmin = async function filings4uRequireAdmin() {
    const db = client();

    if (!db) {
      console.error('[filings4u] Management Supabase client is unavailable.');
      return null;
    }

    const { data, error } = await db.auth.getUser();
    const user = data && data.user;

    if (error || !user) {
      window.location.replace(loginUrl());
      return null;
    }

    /*
     * Management tables are protected by Supabase RLS/private.is_admin().
     * This guard verifies the authenticated browser session; protected
     * database operations remain denied unless the user is an administrator.
     */
    return {
      db,
      supabase: db,
      user,
      session: { user }
    };
  };
})();
