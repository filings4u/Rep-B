const db = window.filings4uSupabase;
const $ = (id) => document.getElementById(id);

function showMessage(text, type = 'error') {
  $('message').textContent = text;
  $('message').className = `message ${type}`;
  $('message').hidden = false;
}

function nextPage() {
  const params = new URLSearchParams(location.search);
  const next = params.get('next');
  if (!next || next.includes('://') || next.startsWith('//')) return 'admin-dashboard.html';
  return next;
}

async function validateAdmin(user) {
  const { data, error } = await db
    .from('admin_profiles')
    .select('id,email_address,first_name,last_name,role,terminated_date')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data && !data.terminated_date ? data : null;
}

async function checkExistingSession() {
  if (!db) return showMessage('Supabase client failed to load.');

  const params = new URLSearchParams(location.search);
  if (params.get('error') === 'not-admin') {
    showMessage('That account is not an active filings4u administrator.');
  }

  const { data: { user } } = await db.auth.getUser();
  if (!user) return;

  $('signOutExisting').hidden = false;

  try {
    const admin = await validateAdmin(user);
    if (admin) {
      showMessage(`Already signed in as ${admin.email_address}. Redirecting…`, 'ok');
      setTimeout(() => location.href = nextPage(), 350);
    }
  } catch (error) {
    console.error(error);
  }
}

$('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('message').hidden = true;
  $('submit').disabled = true;
  $('submit').textContent = 'Signing in…';

  try {
    const email = $('email').value.trim();
    const password = $('password').value;

    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('No authenticated user was returned.');

    const admin = await validateAdmin(data.user);

    if (!admin) {
      await db.auth.signOut();
      throw new Error('This account is not an active filings4u administrator.');
    }

    showMessage('Sign-in successful. Opening the management system…', 'ok');
    location.href = nextPage();
  } catch (error) {
    showMessage(error.message || 'Unable to sign in.');
  } finally {
    $('submit').disabled = false;
    $('submit').textContent = 'Sign in';
  }
});

$('togglePassword').addEventListener('click', () => {
  const input = $('password');
  input.type = input.type === 'password' ? 'text' : 'password';
  $('togglePassword').textContent = input.type === 'password' ? 'Show' : 'Hide';
});

$('signOutExisting').addEventListener('click', async () => {
  await db.auth.signOut();
  $('signOutExisting').hidden = true;
  showMessage('The existing session has been signed out.', 'ok');
});

checkExistingSession();