/**
 * filings4u customer protected-page guard
 * Every customer page requires a valid Supabase session + client profile.
 * After 10 minutes of inactivity, the next protected-page access/action requires login again.
 */
(function () {
  'use strict';

  const root = document.documentElement;
  const TIMEOUT_MS = 10 * 60 * 1000;
  root.classList.add('f4u-auth-pending');

  const db = () => window.filings4uClientSupabase || window.filings4uSupabase || window.supabaseClient || window.filings4uDb || null;
  const target = () => (location.pathname.split('/').pop() || 'client-dashboard.html') + location.search + location.hash;

  function loginUrl(reason) {
    let url = 'customer-login.html?returnTo=' + encodeURIComponent(target());
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

  async function staleSession(client, userId) {
    const security = window.filings4uSessionSecurity;
    const stale = security?.isExpired ? security.isExpired(userId, TIMEOUT_MS) : true;
    if (!stale) return false;
    security?.clearForUser?.(userId);
    try { await client.auth.signOut({ scope: 'local' }); } catch (_) {}
    return true;
  }

  async function verifyClient(options = {}) {
    const client = db();
    if (!client) {
      console.error('[filings4u] Client Supabase client is unavailable.');
      if (options.redirect === false) return null;
      return lockAndRedirect('auth_unavailable');
    }

    // getUser() verifies the signed-in identity with Supabase, not just local storage.
    const { data, error } = await client.auth.getUser();
    const user = data?.user || null;
    if (error || !user) {
      if (options.redirect === false) return null;
      return lockAndRedirect('login_required');
    }

    // A persisted Supabase session is not enough once the inactivity window has expired.
    if (await staleSession(client, user.id)) {
      if (options.redirect === false) return null;
      return lockAndRedirect('session_timeout');
    }

    const [profileResult, adminResult] = await Promise.all([
      client.from('client_profiles')
        .select('id,email_address,first_name,last_name,company_name,avatar_url,tracking_number')
        .eq('id', user.id)
        .maybeSingle(),
      client.from('admin_profiles')
        .select('id,terminated_date')
        .eq('id', user.id)
        .maybeSingle()
    ]);

    if (profileResult.error) {
      console.error('[filings4u] Client profile verification failed.', profileResult.error);
      if (options.redirect === false) return null;
      return lockAndRedirect('account_verification_failed');
    }

    if (adminResult.data && !adminResult.data.terminated_date) {
      try { await client.auth.signOut({ scope: 'local' }); } catch (_) {}
      if (options.redirect === false) return null;
      return lockAndRedirect('admin_account');
    }

    if (!profileResult.data) {
      try { await client.auth.signOut({ scope: 'local' }); } catch (_) {}
      if (options.redirect === false) return null;
      return lockAndRedirect('client_profile_required');
    }

    window.filings4uSessionSecurity?.start({
      db: client,
      user,
      portal: 'client',
      loginPage: 'customer-login.html',
      timeoutMs: TIMEOUT_MS
    });

    reveal();
    return { db: client, supabase: client, user, profile: profileResult.data, session: { user } };
  }

  let readyPromise = null;
  window.filings4uRequireClient = function filings4uRequireClient(options = {}) {
    if (options.redirect === false) return verifyClient(options);
    if (!readyPromise) readyPromise = verifyClient(options);
    return readyPromise;
  };
  window.filings4uClientReady = window.filings4uRequireClient();

  window.filings4uClientSignOut = async function () {
    const client = db();
    const { data } = client ? await client.auth.getUser().catch(() => ({ data: null })) : { data: null };
    window.filings4uSessionSecurity?.clearForUser?.(data?.user?.id);
    if (client) await client.auth.signOut({ scope: 'local' });
    location.replace('customer-login.html');
  };

  const client = db();
  if (client?.auth?.onAuthStateChange) {
    client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') lockAndRedirect('session_expired');
    });
  }
})();
