/**
 * filings4u management authentication + authorization guard.
 * Protected pages stay invisible until Supabase confirms an authenticated admin.
 */
(function () {
  'use strict';

  const root = document.documentElement;
  root.classList.add('f4u-auth-pending');

  const db = () => window.filings4uSupabase || window.supabaseClient || window.filings4uDb || null;
  const target = () => (location.pathname.split('/').pop() || 'admin-management.html') + location.search + location.hash;

  function loginUrl(reason) {
    let url = 'admin-login.html?returnTo=' + encodeURIComponent(target());
    if (reason) url += '&reason=' + encodeURIComponent(reason);
    return url;
  }

  function lockAndRedirect(reason) {
    root.classList.remove('f4u-auth-ready');
    root.classList.add('f4u-auth-pending');
    location.replace(loginUrl(reason || 'login_required'));
    return null;
  }

  function reveal() {
    root.classList.remove('f4u-auth-pending');
    root.classList.add('f4u-auth-ready');
  }

  async function verifyAdmin() {
    const client = db();
    if (!client) {
      console.error('[filings4u] Management Supabase client is unavailable.');
      return lockAndRedirect('auth_unavailable');
    }

    const { data, error } = await client.auth.getUser();
    const user = data && data.user;
    if (error || !user) return lockAndRedirect('login_required');

    // Verify the signed-in user through admin_profiles.
    // The table's RLS policy is backed by the canonical private.is_admin() check.
    const { data: adminProfile, error: adminError } = await client
      .from('admin_profiles')
      .select('id,email_address,role,terminated_date')
      .eq('id', user.id)
      .maybeSingle();

    if (
      adminError ||
      !adminProfile ||
      adminProfile.role !== 'admin' ||
      adminProfile.terminated_date
    ) {
      try { await client.auth.signOut({ scope: 'local' }); } catch (_) {}
      return lockAndRedirect('admin_required');
    }

    reveal();
    return {
      db: client,
      supabase: client,
      user,
      adminProfile,
      session: { user },
      isAdmin: true
    };
  }

  let readyPromise = null;
  window.filings4uRequireAdmin = function filings4uRequireAdmin() {
    if (!readyPromise) readyPromise = verifyAdmin();
    return readyPromise;
  };
  window.filings4uAdminReady = window.filings4uRequireAdmin();

  const client = db();
  if (client?.auth?.onAuthStateChange) {
    client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') lockAndRedirect('session_expired');
    });
  }
})();
