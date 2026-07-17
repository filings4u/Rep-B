/**
 * 👤 CLIENT SETTINGS & HISTORY UTILITY DRIVER
 * Synchronized with filings4u customer portal core architecture frameworks.
 */
window.addEventListener("supabaseEngineReady", function (engineEvent) {
  "use strict";

  // Validate that the system broadcast payload structure is fully populated
  if (!engineEvent || !engineEvent.detail || !engineEvent.detail.session) {
    throw new Error("Core Handshake Exception: Settings utility loader missing valid session validation.");
  }

  const session = engineEvent.detail.session;
  const currentUserId = session.user.id;

  // Dispatch profile data hydration sequences
  fetchHistoricalOrderParameters(currentUserId);
  loadProfileParameterSettings(currentUserId);
  setupProfileMutationFormHandler(currentUserId);
});

/**
 * 📡 DATABASE ACCESS DISPATCH: HISTORICAL PURCHASE LOGS
 * Gathers relational purchase invoices and throws exceptions on schema violations.
 */
async function fetchHistoricalOrderParameters(userId) {
  "use strict";

  if (!userId) {
    throw new Error("Data Integrity Exception: History fetch aborted due to missing profile metrics.");
  }

  const outputTarget = document.getElementById("historicalOrdersTargetStack");
  if (!outputTarget) return; // Exit cleanly if this specific layout node isn't present in active template

  // Execute query pulling relational text blocks natively from your billing tables
  const { data: orders, error } = await window.supabaseInstance
    .from('orders')
    .select('id, total_amount, status, created_at, services(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // STRICT ERROR CHECKING: Halt execution loops instantly if database faults trigger
  if (error) {
    console.error("Historical Orders Database Failure Context:", error);
    throw new Error(`Database Operation Exception: [${error.code}] ${error.message}`);
  }

  // Handle empty transaction arrays safely with structural zero-state metrics
  if (!orders || orders.length === 0) {
    outputTarget.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">No historic platform transactions recorded under this token.</p>`;
    return;
  }

  outputTarget.innerHTML = orders.map(ord => {
    // Assert value data parameters to ensure mapping loop boundaries stay solid
    if (!ord.id || ord.total_amount === undefined || !ord.status || !ord.created_at) {
      throw new Error(`Data Integrity Exception: Failed mapping corrupted invoice index record ID: ${ord.id || 'Unknown'}`);
    }

    const cleanServiceTitle = ord.services?.name || 'Corporate Processing Service';
    const cleanIdToken = String(ord.id).slice(0, 8);
    const formattedDate = new Date(ord.created_at).toLocaleDateString();
    const formattedAmount = parseFloat(ord.total_amount).toFixed(2);
    
    const isCompletedStatus = ord.status === 'Completed';

    return `
      <div style="border: 1px solid var(--border-color) !important; border-radius: 8px !important; padding: 14px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; box-sizing: border-box !important;">
        <div>
          <strong style="display: block !important; font-size: 0.85rem !important; color: var(--text-dark) !important;">${cleanServiceTitle}</strong>
          <small style="color: var(--text-muted); font-size: 0.7rem;">Placement Matrix ID: <code>${cleanIdToken}</code> | ${formattedDate}</small>
        </div>
        <div style="text-align: right !important;">
          <span style="display: block; font-size: 0.9rem; font-weight: 800; color: var(--text-dark); margin-bottom: 4px;">$${formattedAmount}</span>
          <span style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: ${isCompletedStatus ? 'var(--emerald)' : '#d97706'}">${ord.status}</span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 📡 DATABASE ACCESS DISPATCH: PROFILE FIELDS HYDRATION
 * Pulls registration rows and populates input target nodes instantly.
 */
async function loadProfileParameterSettings(userId) {
  "use strict";

  if (!userId) {
    throw new Error("Data Integrity Exception: Operation aborted due to missing profile metrics.");
  }

  const firstNameInput = document.getElementById("profileFirstNameInput");
  const lastNameInput = document.getElementById("profileLastNameInput");

  // Exit cleanly if input target components do not live on the current page layout
  if (!firstNameInput || !lastNameInput) return;

  const { data: currentProfile, error } = await window.supabaseInstance
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Profile Fetch Operational Failure:", error);
    throw new Error(`Database Operation Exception: [${error.code}] ${error.message}`);
  }

  if (currentProfile) {
    firstNameInput.value = currentProfile.first_name || "";
    lastNameInput.value = currentProfile.last_name || "";
  }
}

/**
 * ⚡ MUTATOR INTERACTION HANDLER: SAVE PROFILE SETTINGS
 * Binds submit events, patches core rows, and mutates header interfaces.
 */
function setupProfileMutationFormHandler(userId) {
  "use strict";

  if (!userId) {
    throw new Error("Data Integrity Exception: Mutation hook initialization failed due to invalid context.");
  }

  const configurationFormNode = document.getElementById("profileCredentialsForm");
  if (!configurationFormNode) return;

  configurationFormNode.addEventListener("submit", async function (e) {
    e.preventDefault();

    const firstNameInput = document.getElementById("profileFirstNameInput");
    const lastNameInput = document.getElementById("profileLastNameInput");
    const infoFeedbackNode = document.getElementById("profileMutateMessageFeedback");

    if (!firstNameInput || !lastNameInput) {
      throw new Error("Viewport Structure Exception: Target input fields dropped out of the active DOM layout.");
    }

    const firstNameValue = firstNameInput.value.trim();
    const lastNameValue = lastNameInput.value.trim();

    if (!firstNameValue || !lastNameValue) {
      throw new Error("Validation Exception: Name parameters cannot be empty values.");
    }

    console.log("📡 Dispatching profile mutation metrics up to database records...");
    
    const { error: updateError } = await window.supabaseInstance
      .from('profiles')
      .update({ first_name: firstNameValue, last_name: lastNameValue })
      .eq('id', userId);

    if (updateError) {
      console.error("Profile Row Mutation Failure Context:", updateError);
      throw new Error(`Database Update Exception: [${updateError.code}] ${updateError.message}`);
    }

    // Reflect fresh metrics inside the interface headers immediately
    if (infoFeedbackNode) {
      infoFeedbackNode.style.display = "block";
    }

    const globalClientHeaderName = document.getElementById("clientNameField");
    if (globalClientHeaderName) {
      globalClientHeaderName.textContent = `${firstNameValue} ${lastNameValue}`;
    }

    // Set clear UI feedback timeout parameters safely
    setTimeout(function () {
      if (infoFeedbackNode) {
        infoFeedbackNode.style.display = "none";
      }
    }, 3000);
  });
}
