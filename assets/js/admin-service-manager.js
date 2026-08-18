
function enforceAdminAccess() {
  const hash = "lrbimrlbskjweynxlgas";
  const key = `sb-${hash}-auth-token`;
  try {
    const raw = localStorage.getItem(key);
    const session = raw ? JSON.parse(raw) : null;
    const email = String(session?.user?.email || "").toLowerCase();
    const role = session?.user?.user_metadata?.role;
    if (!session?.access_token) {
      document.documentElement.style.display = "none";
      window.location.replace("admin-login.html");
      return false;
    }
    if (role !== "admin" && !email.endsWith("@filings4u.com")) {
      document.documentElement.style.display = "none";
      window.location.replace("client-dashboard.html");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Admin access verification failed:", error);
    document.documentElement.style.display = "none";
    window.location.replace("admin-login.html");
    return false;
  }
}

function getAdminSupabaseClient() {
  if (window.supabaseInstance && typeof window.supabaseInstance.from === "function") return window.supabaseInstance;
  if (window.supabaseClient && typeof window.supabaseClient.from === "function") return window.supabaseClient;
  if (window.supabase && typeof window.supabase.createClient === "function") {
    const client = window.supabase.createClient("https://lrbimrlbskjweynxlgas.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJsdWJpbXJsYnNramV5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU", {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    window.supabaseInstance = client;
    window.supabaseClient = client;
    return client;
  }
  return null;
}

function updateAdminClock() {
  const clock = document.getElementById("portal-clock");
  if (!clock) return;
  clock.textContent = new Date().toLocaleString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}

function escapeAdminHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}


function showFulfillmentMessage(message) {
  const node = document.getElementById("fulfillment-feedback");
  if (!node) return; node.textContent = message; node.hidden = false;
  window.clearTimeout(showFulfillmentMessage.timer);
  showFulfillmentMessage.timer = window.setTimeout(() => { node.hidden = true; }, 5000);
}
