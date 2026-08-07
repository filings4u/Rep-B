/**
 * filings4u Platform Architecture
 * Module: get-started.js (Clean Service Catalog Matrix with Direct Website Link Routing)
 */
window.FILINGS4U_GETSTARTED_TARGET = "filings4u-get-started-root";

(function injectGetStartedPremiumStyles() {
  const styleId = "f4u-get-started-premium-styles";
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement("style");
    styleSheet.id = styleId;
    styleSheet.textContent = `
      .f4u-gs-grid-matrix { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important; gap: 30px !important; width: 100% !important; box-sizing: border-box !important; margin-bottom: 50px !important; }
      .f4u-gs-card { background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-radius: 14px !important; padding: 0 !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; box-shadow: 0 4px 6px -1px rgba(10, 31, 68, 0.02) !important; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important; text-align: left !important; overflow: hidden !important; height: 100% !important; }
      .f4u-gs-card:hover { transform: translateY(-6px) !important; box-shadow: 0 20px 35px -10px rgba(10, 31, 68, 0.08), 0 0 0 1px #10b981 !important; }
      .f4u-gs-card-body { padding: 24px !important; display: flex !important; flex-direction: column !important; flex-grow: 1 !important; justify-content: space-between !important; }
      @media (max-width: 768px) { .f4u-gs-grid-matrix { grid-template-columns: 1fr !important; gap: 20px !important; } }
      @media (max-width: 991px) { .f4u-gs-category-title { font-size: 0.98rem !important; } }
    `;
    document.head.appendChild(styleSheet);
  }
})();

function renderMasterGetStartedEngine(overrideTargetId) {
  try {
    const targetId = overrideTargetId || window.FILINGS4U_GETSTARTED_TARGET || "filings4u-get-started-root";
    const zone = document.getElementById(targetId);
    if (!zone) return;

    var gsHTML = "";
    gsHTML += '<div style="max-width: 1450px; margin: 20px auto 60px auto; padding: 0; box-sizing: border-box; width: 100%;">';
    
    // 🧱 VERTICAL SECTOR 1.0: CORPORATE FORMATION & GOVERNANCE ARCHITECTURE
    gsHTML += '<div style="margin-bottom: 35px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; text-align: left;">';
    gsHTML += '  <h2 class="f4u-gs-category-title" style="color: #0a1f44; font-size: 1.4rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; line-height: 1.3;">1.0 Corporate Formations &amp; Registries</h2>';
    gsHTML += '</div>';
    gsHTML += '<div class="f4u-gs-grid-matrix">';

    var formationsData = [
      { slug: "llc-formation", name: "LLC Formation", desc: "Execute state articles of organization, statutory entity structural records, and operational deeds." },
      { slug: "corporations", name: "Corporations", desc: "Establish corporate charter configurations, shareholder parameters, and initial board resolutions." },
      { slug: "sole-proprietorship", name: "Sole Proprietorship", desc: "Process local county business registration certificates and independent trade structure records." },
      { slug: "dba-registration", name: "DBA Registration", desc: "Secure doing-business-as trade names, fictitious filings, and municipal indexing matrices." },
      { slug: "nonprofit-organization", name: "Nonprofit Organization", desc: "Form charitable foundation frameworks, articles of incorporation, and asset dedication allocations." },
      { slug: "series-llc", name: "Series LLC", desc: "Deploy master protective structures with independent asset protection cells and split-liability rings." },
      { slug: "foreign-qualification", name: "Foreign Qualification", desc: "Acquire secondary state certificates of authority to expand existing corporate operations cross-border." },
      { slug: "llc-reinstatement", name: "LLC Reinstatement", desc: "Recover administratively dissolved records, clear penalty balances, and restore compliance status." },
      { slug: "trademark-filing", name: "Trademark Filing", desc: "Submit corporate brand naming rights and wordmark applications securely to federal registries." },
      { slug: "servicemark-filing", name: "Servicemark Filing", desc: "Register specific operational markings, utility design phrases, and logo markers error-free." },
      { slug: "annual-reports", name: "Annual Reports", desc: "Compile statutory mandatory state annual listings and information reports to maintain clean standing." },
      { slug: "operating-agreement", name: "Operating Agreement", desc: "Generate internal company bylaws, capital contribution matrices, and initial signature blueprints." },
      { slug: "registered-agent", name: "Registered Agent", desc: "Establish state statutory legal representation and real-time service of process scanning loops." },
      { slug: "business-licenses", name: "Business Licenses", desc: "Secure local municipal city permits, country listings, and specialized operational licensing codes." },
      { slug: "employer-id-ein", name: "Employer ID (EIN)", desc: "Procure federal employer identification tax numbers from the IRS for commercial banking clearances." }
    ];

    const catalogSource = window.PLATFORM_METRICS_CATALOG || {};

    formationsData.forEach(function(item) {
      const dataNode = catalogSource[item.slug] || {};
      const cardImg = dataNode.img_src || ('images/' + item.slug + '-hero.jpg');
      
      gsHTML += ' <div class="f4u-gs-card">';
      gsHTML += '   <div style="width: 100%; height: 160px; overflow: hidden; background: #0a1f44; border-bottom: 1px solid #e2e8f0;">';
      gsHTML += '     <img src="' + cardImg + '" style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s;" onerror="this.onerror=null; this.src=\'images/index-hero.jpg\';">';
      gsHTML += '   </div>';
      gsHTML += '   <div class="f4u-gs-card-body">';
      gsHTML += '     <div style="margin-bottom: 20px;">';
      gsHTML += '       <h3 style="color: #0a1f44; font-size: 1.15rem; font-weight: 700; margin: 0 0 10px 0;">' + item.name + '</h3>';
      gsHTML += '       <p style="color: #475569; font-size: 0.88rem; line-height: 1.5; margin: 0;">' + item.desc + '</p>';
      gsHTML += '     </div>';
      // 🟢 REDIRECT HOOK: Pushes click actions directly onto your primary website pages
      gsHTML += '     <a href="https://filings4u.com/' + item.slug + '.html" style="background: #0a1f44; color: #ffffff; text-decoration: none; padding: 11px 16px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; text-align: center; display: block; transition: background 0.2s; box-shadow: 0 4px 12px rgba(10,31,68,0.05);">View Details &rarr;</a>';
      gsHTML += '   </div>';
      gsHTML += ' </div>';
    });
    gsHTML += '</div>';

    zone.setAttribute("data-gs-cache", gsHTML);
  } catch (err) {
    console.error("Get Started canvas layout frame compilation crash:", err);
  }
}
/* Part 2 - Fragment 2 of 2: Fiscal, Freight Logistics & Direct Page Mounts */
(function() {
  const targetId = window.FILINGS4U_GETSTARTED_TARGET || "filings4u-get-started-root";
  
  setTimeout(function() {
    const zone = document.getElementById(targetId);
    if (!zone) return;

    // 1. Retrieve the starting corporate formation layout strings compiled by Block 1
    var gsHTML = zone.getAttribute("data-gs-cache") || "";
    const catalogSource = window.PLATFORM_METRICS_CATALOG || {};

    // 🧱 VERTICAL SECTOR 2.0: FISCAL SYSTEMS & TAX ARCHITECTURE
    gsHTML += ' <div style="margin-bottom: 35px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-top: 50px; text-align: left;">';
    gsHTML += '   <h2 class="f4u-gs-category-title" style="color: #0a1f44; font-size: 1.4rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; line-height: 1.3;">2.0 Tax &amp; Fiscal Compliance Ledgers</h2>';
    gsHTML += ' </div>';
    gsHTML += ' <div class="f4u-gs-grid-matrix">';

    var taxData = [
      { slug: "federal-tax", name: "Federal Tax Registration", desc: "Configure corporate income tax reporting schedules, operational tax metrics, and IRS file entries." },
      { slug: "state-tax", name: "State Tax Registration", desc: "Map regional local revenue returns, franchise balance clearances, and state account parameters." },
      { slug: "franchise-tax", name: "Franchise Tax Filing", desc: "Process annual corporate privilege tax ledgers, capitalization reports, and statutory returns." },
      { slug: "sales-tax-registration", name: "Sales Tax Registration", desc: "Establish state reseller permits, physical/economic nexus certificates, and collection bindings." },
      { slug: "payroll-tax-940-941", name: "Payroll Tax (940/941)", desc: "Submit quarterly employer tax returns, unemployment parameters, and workforce deduction logs." },
      { slug: "heavy-use-tax-2290", name: "Heavy Use Tax (2290)", desc: "File commercial fleet highway vehicle weight tax schedules and secure Schedule 1 receipts." }
    ];

    taxData.forEach(function(item) {
      const dataNode = catalogSource[item.slug] || {};
      const cardImg = dataNode.img_src || ('images/' + item.slug + '-hero.jpg');
      
      gsHTML += ' <div class="f4u-gs-card">';
      gsHTML += '   <div style="width: 100%; height: 160px; overflow: hidden; background: #0a1f44; border-bottom: 1px solid #e2e8f0;">';
      gsHTML += '     <img src="' + cardImg + '" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src=\'images/index-hero.jpg\';">';
      gsHTML += '   </div>';
      gsHTML += '   <div class="f4u-gs-card-body">';
      gsHTML += '     <div style="margin-bottom: 20px;">';
      gsHTML += '       <h3 style="color: #0a1f44; font-size: 1.15rem; font-weight: 700; margin: 0 0 10px 0;">' + item.name + '</h3>';
      gsHTML += '       <p style="color: #475569; font-size: 0.88rem; line-height: 1.5; margin: 0;">' + item.desc + '</p>';
      gsHTML += '     </div>';
      gsHTML += '     <a href="https://filings4u.com/' + item.slug + '.html" style="background: #0a1f44; color: #ffffff; text-decoration: none; padding: 11px 16px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; text-align: center; display: block; box-shadow: 0 4px 12px rgba(10,31,68,0.05);">View Details &rarr;</a>';
      gsHTML += '   </div>';
      gsHTML += ' </div>';
    });
    gsHTML += ' </div>';

    // 🧱 VERTICAL SECTOR 3.0: LOGISTICS INFRASTRUCTURE & FLEET MANAGEMENT
    gsHTML += ' <div style="margin-bottom: 35px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-top: 50px; text-align: left;">';
    gsHTML += '   <h2 class="f4u-gs-category-title" style="color: #0a1f44; font-size: 1.4rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; line-height: 1.3;">3.0 Logistics Infrastructure &amp; Commercial Fleets</h2>';
    gsHTML += ' </div>';
    gsHTML += ' <div class="f4u-gs-grid-matrix">';

    var logisticsData = [
      { slug: "cage-code", name: "CAGE Code Registration", desc: "Secure commercial and government entity supply numbers for federal procurement systems access." },
      { slug: "duns-number", name: "DUNS Number Indexing", desc: "Acquire global Dun &amp; Bradstreet organizational records tracking codes for credit clearance." },
      { slug: "minority-certificate", name: "Minority Certificate Dossier", desc: "Structure diverse supplier verification metrics for certified state procurement bidding loops." },
      { slug: "trucker-authority", name: "Trucker Authority (MC/DOT)", desc: "Deploy FMCSA operating authority credentials, safety parameters, and active carrier pipelines." },
      { slug: "broker-authority", name: "Broker Authority License", desc: "Build property broker authority profiles, bond declarations, and carrier intermediary nodes." },
      { slug: "ucr-registration", name: "UCR Registration", desc: "Complete unified carrier compliance tracking and multi-state vehicle bracket fee grids." },
      { slug: "scac-code", name: "SCAC Code Allocation", desc: "Register standard carrier alpha identifiers for EDI electronic data intermodal freight exchanges." },
      { slug: "dot-consortium", name: "DOT Drug Consortium Pool", desc: "Initialize random safety drug compliance testing pools and federal Clearinghouse verifications." },
      { slug: "driver-qualification-file", name: "Driver Qualification File", desc: "Compile statutory commercial driver qualification history files and background ledger logs." },
      { slug: "process-agent-boc-3", name: "Process Agent (BOC-3)", desc: "File mandatory process agent representation parameters to activate tracking authority codes." },
      { slug: "ifta-registration", name: "IFTA Registration Decals", desc: "Secure international fuel tax license records, mileage arrays, and multi-state truck decals." },
      { slug: "hazmat-registration", name: "HAZMAT Safety Registration", desc: "Submit PHMSA hazardous material cargo transit safety parameters and federal handling permits." },
      { slug: "licenses-permits", name: "Logistics Licenses &amp; Permits", desc: "Acquire specialized intra-state transportation permits, overweight records, and transit slips." },
      { slug: "trucker-insurance-quote", name: "Trucker Insurance Quote", desc: "Route primary vehicle auto liabilities, cargo indemnities, and fleet coverage risk data vectors." },
      { slug: "broker-insurance-quote", name: "Broker Insurance Quote", desc: "Establish contingent cargo liability records, omissions protection paths, and broker bonds." },
      { slug: "new-entrant-audit", name: "New Entrant Audit Check", desc: "Build pre-audit safety files, driver records history, and vehicle inspection dossiers error-free." },
      { slug: "mcs-150-update", name: "MCS-150 Biennial Update", desc: "Process mandatory biennial carrier update metrics to protect existing operating authority active logs." },
      { slug: "ifta-quarterly-returns", name: "IFTA Quarterly Returns", desc: "Calculate jurisdictional fuel usage mileage matrices to file ongoing transit fuel tax summaries." },
      { slug: "boc-3-amendment", name: "BOC-3 Process Agent Amendment", desc: "Modify active process agent legal representation records securely across target jurisdictions." },
      { slug: "dissolution", name: "Entity Dissolution", desc: "Process articles of dissolution and account closures to safely terminate corporate tracking parameters." },
      { slug: "certificate-of-good-standing", name: "Certificate of Good Standing", desc: "Query real-time secretarial health status verifications and order certified standing records." },
      { slug: "apostille-services", name: "Apostille Authentication", desc: "Submit inter-governmental documentation authentication paths and international legal seals validation." },
      { slug: "clia-certificate", name: "CLIA Laboratory Certificate", desc: "Complete clinical laboratory improvement amendment applications and federal CMS registry verifications." }
    ];

    logisticsData.forEach(function(item) {
      const dataNode = catalogSource[item.slug] || {};
      const cardImg = dataNode.img_src || ('images/' + item.slug + '-hero.jpg');

      gsHTML += ' <div class="f4u-gs-card">';
      gsHTML += '   <div style="width: 100%; height: 160px; overflow: hidden; background: #0a1f44; border-bottom: 1px solid #e2e8f0;">';
      gsHTML += '     <img src="' + cardImg + '" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src=\'images/index-hero.jpg\';">';
      gsHTML += '   </div>';
      gsHTML += '   <div class="f4u-gs-card-body">';
      gsHTML += '     <div style="margin-bottom: 20px;">';
      gsHTML += '       <h3 style="color: #0a1f44; font-size: 1.15rem; font-weight: 700; margin: 0 0 10px 0;">' + item.name + '</h3>';
      gsHTML += '       <p style="color: #475569; font-size: 0.88rem; line-height: 1.5; margin: 0;">' + item.desc + '</p>';
      gsHTML += '     </div>';
      gsHTML += '     <a href="https://filings4u.com/' + item.slug + '.html" style="background: #0a1f44; color: #ffffff; text-decoration: none; padding: 11px 16px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; text-align: center; display: block; box-shadow: 0 4px 12px rgba(10,31,68,0.05);">View Details &rarr;</a>';
      gsHTML += '   </div>';
      gsHTML += ' </div>';
    });

    gsHTML += ' </div>'; // Close Section 3.0 grid matrix
    gsHTML += '</div>';  // Close max-width alignment guard box

    // 4. Securely mount the complete compiled marketplace catalog onto your page root node layout anchor
    zone.innerHTML = gsHTML;
    zone.removeAttribute("data-gs-cache");
  }, 50);
})();
