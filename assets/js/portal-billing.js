/**
 * ==========================================================================
 * 💰 FILINGS4U INDEPENDENT TRANSACTION & PORTAL EXTRACTION ENGINE
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initStripeCheckoutListeners();
});

/**
 * 1. SECURE PAYMENT CAPTURE LISTENERS
 */
function initStripeCheckoutListeners() {
  // Targets purchase buttons via a clean data attribute modifier to prevent layout script conflicts
  const buyButtons = document.querySelectorAll("[data-stripe-trigger]");
  const statusNotification = document.getElementById("order-status-message-target");

  buyButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      
      // Pull product variables safely straight from html element data node parameters
      const priceId = button.getAttribute("data-price-id");
      const serviceName = button.getAttribute("data-service-name") || "Compliance Filing Tier";
      
      if (!priceId) {
        console.error("Stripe Transaction Aborted: Button element is missing a valid data-price-id mapping.");
        return;
      }

      // Update button state visually to provide fluid tactile checkout feedback to users
      const originalButtonText = button.textContent;
      button.textContent = "Processing Securely...";
      button.style.opacity = "0.7";
      button.style.pointerEvents = "none";

      try {
        // Enforce strong parameter typing layout schemas to avoid Supabase 400 Bad Request rejections
        const executionPayload = {
          priceId: String(priceId).trim(),
          quantity: 1,
          metadata: {
            siteOrigin: window.location.origin,
            timestamp: new Date().toISOString(),
            selectedService: String(serviceName).trim()
          }
        };

        console.log("🚀 Mapping payload tracking streams securely to backend context...", executionPayload);

        if (!window.supabase) {
          throw new Error("Supabase client instance is missing from the global window runtime environment scope.");
        }

        // Invoke the secure remote cloud checkout Edge Function pipeline
        const { data, error } = await window.supabase.functions.invoke('stripe-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(executionPayload) // Hard stringification blocks database parsing anomalies
        });

        if (error) throw error;

        // Route clients over to Stripe's payment destination viewscreen
        if (data && data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("The endpoint completed operations but did not return a valid Stripe redirection URL.");
        }

      } catch (faultErr) {
        console.error("Stripe Execution Fault Captured:", faultErr);
        
        // Reset interactive element controls gracefully
        button.textContent = originalButtonText;
        button.style.opacity = "1";
        button.style.pointerEvents = "auto";

        if (statusNotification) {
          statusNotification.textContent = `Order execution fault: ${faultErr.message || 'Verification rejected'}`;
          statusNotification.style.color = "#ef4444";
        }
      }
    });
  });
}
