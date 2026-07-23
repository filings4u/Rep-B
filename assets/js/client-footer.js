/**
 * filings4u Client Portal Centralized Footer Injection Engine
 * Renders a strict single-row desktop layout containing copyright text, centered trust seals, and side privacy paths.
 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const portalMain = document.querySelector(".portal-main");
  if (!portalMain) return;

  const footerElement = document.createElement("footer");
  footerElement.id = "f4u-centralized-portal-footer";
  
  // Refined style configuration to enforce rigid horizontal rows on desktop interfaces
  footerElement.style.cssText = `
    width: 100% !important;
    margin-top: auto !important;
    padding: 20px 40px !important;
    background: #0f172a !important;
    color: #94a3b8 !important;
    font-size: 0.8rem !important;
    border-top: 1px solid #1e293b !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
    flex-wrap: nowrap !important;
  `;

  footerElement.innerHTML = `
    <!-- Left: Corporate Attribution Group -->
    <div style="text-align: left !important; line-height: 1.5 !important; min-width: 280px !important;">
      <span style="color: #64748b !important;">&copy; 2026 filings4u, LLC. All rights reserved.</span><br>
      <span style="font-size: 0.75rem !important; color: #475569 !important;">A Subsidiary of 
        <a href="https://roselandcompanies.com" target="_blank" rel="noopener noreferrer" style="color: #c15254 !important; text-decoration: none !important; font-weight: 700 !important;">Roseland Companies, LLC</a>
      </span>
    </div>

    <!-- Center: Cryptographic Trust Shield -->
    <div style="background: rgba(255, 255, 255, 0.04) !important; border: 1px solid rgba(255, 255, 255, 0.08) !important; border-radius: 6px !important; padding: 8px 16px !important; display: inline-flex !important; align-items: center !important; gap: 8px !important; font-size: 0.78rem !important; white-space: nowrap !important;">
      <span style="color: #10b981 !important; font-weight: 900 !important; letter-spacing: 0.5px !important;">SECURE</span>
      <span style="color: #cbd5e1 !important; font-weight: 500 !important;">256-bit SSL Encrypted Connection</span>
    </div>

    <!-- Right: Compliance Hyperlinks Grid -->
    <div style="display: flex !important; gap: 20px !important; align-items: center !important; justify-content: flex-end !important; min-width: 200px !important; font-weight: 600 !important; white-space: nowrap !important;">
      <a href="client-privacy-policy.html" style="color: #cbd5e1 !important; text-decoration: none !important; transition: color 0.1s ease !important;">Privacy Policy</a>
      <a href="client-terms-of-service.html" style="color: #cbd5e1 !important; text-decoration: none !important; transition: color 0.1s ease !important;">Terms of Service</a>
    </div>

    <!-- Responsive Adaptive Media Injector Sheet -->
    <style>
      #f4u-centralized-portal-footer a:hover { color: #10b981 !important; }
      @media (max-width: 768px) {
        #f4u-centralized-portal-footer { flex-direction: column !important; gap: 20px !important; text-align: center !important; padding: 30px 20px !important; }
        #f4u-centralized-portal-footer div { text-align: center !important; justify-content: center !important; width: 100% !important; }
        #f4u-centralized-portal-footer div:last-child { gap: 15px !important; flex-direction: column !important; }
      }
    </style>
  `;

  portalMain.appendChild(footerElement);
});
