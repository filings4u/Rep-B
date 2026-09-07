(() => {
  'use strict';

  const db = window.filings4uSupabase;
  const LOGIN_PAGE = 'customer-login.html';

  function loginUrl(reason) {
    const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    return `${LOGIN_PAGE}?error=${encodeURIComponent(reason)}&next=${next}`;
  }

  async function localSignOut() {
    if (db) await db.auth.signOut({ scope: 'local' });
  }

  window.filings4uRequireClient = async function filings4uRequireClient() {
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

    const [{ data: client, error: clientError }, { data: admin, error: adminError }] = await Promise.all([
      db.from('client_profiles')
        .select('id,email_address,first_name,last_name,company_name,avatar_url')
        .eq('id', user.id)
        .maybeSingle(),
      db.from('admin_profiles')
        .select('id,email_address,terminated_date')
        .eq('id', user.id)
        .maybeSingle()
    ]);

    if (clientError || adminError) {
      console.error(clientError || adminError);
      await localSignOut();
      location.replace(loginUrl('access-check-failed'));
      return null;
    }

    if (!client || admin) {
      await localSignOut();
      location.replace(loginUrl(admin ? 'admin-account' : 'not-client'));
      return null;
    }

    return { db, user, profile: client };
  };

  window.filings4uSignOut = async function filings4uSignOut(event) {
    event?.preventDefault?.();
    await localSignOut();
    location.replace(LOGIN_PAGE);
  };
})();
