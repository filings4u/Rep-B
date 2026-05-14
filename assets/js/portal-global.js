// assets/js/portal-global.js

// Keep track of database synchronization states
let recordDatabaseId = null;

// Initialize continuous background operations
document.addEventListener("DOMContentLoaded", () => {
    initializePortalClock();
    attemptRestoreSessionDraft();
});

function initializePortalClock() {
    const clockNode = document.getElementById('portal-clock');
    if (!clockNode) return;
    setInterval(() => {
        const now = new Date();
        clockNode.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }, 1000);
}

// Automatically pulls historical data if an uncompleted draft exists in Supabase
async function attemptRestoreSessionDraft() {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceKey = urlParams.get("service") || "2290";
    sessionStorage.setItem("checkout_service_key", serviceKey);

    if (!window.supabase) return;
    
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) return; // Testing locally without auth session active

    const { data, error } = await window.supabase
        .from('user_filings_workspace')
        .select('id, payload_data, current_step')
        .eq('service_key', serviceKey)
        .eq('status', 'draft')
        .maybeSingle();

    if (data && !error) {
        recordDatabaseId = data.id;
        sessionStorage.setItem("collected_wizard_payload", JSON.stringify(data.payload_data));
        // If currentStepIndex is accessible globally in wizard-engine.html, sync it
        if (typeof currentStepIndex !== 'undefined') {
            currentStepIndex = data.current_step;
            if (typeof renderStepContents === 'function') renderStepContents();
        }
    }
}

// Executed instantly on every "Save & Continue" or "Save & Exit" click
async function synchronizeStepToCloud(currentStepIdx, finalStepPayload) {
    const serviceKey = sessionStorage.getItem("checkout_service_key");
    sessionStorage.setItem("collected_wizard_payload", JSON.stringify(finalStepPayload));

    if (!window.supabase) return;
    
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) return; // User is in public sandbox testing profile mode

    const recordPayload = {
        service_key: serviceKey,
        payload_data: finalStepPayload,
        current_step: currentStepIdx,
        status: 'draft',
        user_id: user.id
    };

    if (recordDatabaseId) recordPayload.id = recordDatabaseId;

    const { data, error } = await window.supabase
        .from('user_filings_workspace')
        .upsert(recordPayload)
        .select('id')
        .single();

    if (!error && data) {
        recordDatabaseId = data.id;
    } else {
        console.error("Database persistence stalled:", error);
    }
}

// Final operations for terminal transitions inside order.html checkout
async function updateFilingToPaidStatus() {
    const serviceKey = sessionStorage.getItem("checkout_service_key");
    if (!window.supabase || !recordDatabaseId) return;

    await window.supabase
        .from('user_filings_workspace')
        .update({ status: 'paid' })
        .eq('id', recordDatabaseId);
}

function handleSaveExit() {
    const modal = document.getElementById('save-modal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        executePortalExit();
    }
}

function closeSaveModal() {
    const modal = document.getElementById('save-modal');
    if (modal) modal.style.display = 'none';
}

function executePortalExit() {
    window.location.href = "dashboard.html";
}

// supabase/functions/stripe-paid-signup/index.js
import { createClient } from 'esm.sh'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') // Admin access to bypass standard user gates
)

export default async (req) => {
  const payload = await req.json()
  
  // Intercept the checkout event token sent directly from Stripe's network servers
  if (payload.type === 'checkout.session.completed') {
    const session = payload.data.object
    const customerEmail = session.customer_details.email
    const purchasedService = session.metadata.service_key // e.g., 'ein', '2290'

    // Step A: Force generate a secure authenticated user account inside your database
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: customerEmail,
      email_confirm: true, // Auto-verifies email to streamline workspace delivery
      user_metadata: { purchase_type: purchasedService }
    })

    if (!userError && user) {
      // Step B: Automatically insert their paid transaction record straight into your active workspace tracker table
      await supabaseAdmin
        .from('user_filings_workspace')
        .insert({
          user_id: user.user.id,
          service_key: purchasedService,
          status: 'paid', // Immediately flags as paid to unblock dashboard features
          current_step: 0
        })

      // Step C: Trigger Supabase to email them a magic link invite password generation token
      await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: customerEmail,
        options: { redirectTo: 'filings4u.com' }
      })
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } })
}
