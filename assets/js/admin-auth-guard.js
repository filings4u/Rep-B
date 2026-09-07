(() => {
  'use strict';

  const db = window.filings4uSupabase;
  const LOGIN_PAGE = 'admin-login.html';

  function loginUrl(reason) {
    const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    return `${LOGIN_PAGE}?error=${encodeURIComponent(reason)}&next=${next}`;
  }

  async function localSignOut() {
    if (db) await db.auth.signOut({ scope: 'local' });
  }

  window.filings4uRequireAdmin = async function filings4uRequireAdmin() {
    if (!db) {
      location.replace(loginUrl('auth-unavailable'));
      return null;
    }

    const { data: userData, error: userError } = await db.auth.getUser();
    const user = userError ? null : userData?.user;

    if (!user) {
      location.replace(loginUrl('sign-in-required'));
      return null;
    }

    const [{ data: admin, error: adminError }, { data: client, error: clientError }] = await Promise.all([
      db.from('admin_profiles')
        .select('id,email_address,first_name,last_name,role,terminated_date,avatar_url')
        .eq('id', user.id)
        .maybeSingle(),
      db.from('client_profiles')
        .select('id,email_address')
        .eq('id', user.id)
        .maybeSingle()
    ]);

    if (adminError || clientError) {
      console.error(adminError || clientError);
      await localSignOut();
      location.replace(loginUrl('access-check-failed'));
      return null;
    }

    if (!admin || admin.terminated_date || client) {
      await localSignOut();
      location.replace(loginUrl(client ? 'client-account' : 'not-admin'));
      return null;
    }

    return { db, user, profile: admin };
  };

  window.filings4uSignOut = async function filings4uSignOut(event) {
    event?.preventDefault?.();
    await localSignOut();
    location.replace(LOGIN_PAGE);
  };
})();
