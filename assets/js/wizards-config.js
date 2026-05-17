/* ==========================================================================
   📦 FILINGS4U GOVERNMENT-LEVEL DATA REGISTRY (wizards-config.js)
   ========================================================================== */

window.WIZARD_REGISTRY = {
    // --- CATEGORY 1: BUSINESS FORMATIONS ---
    "llc-formation": {
        title: "LLC Formation Registration Terminal",
        description: "Formally execute state articles of organization. Captures all mandatory structural and ownership parameters required by the Secretary of State.",
        prices: { starter: 99.00, compliance: 149.00, enterprise: 349.00 },
        extraFields: [
            { id: "llc_state", label: "Target Formation State / Jurisdiction", type: "text", placeholder: "e.g., Delaware, Texas, Wyoming" },
            { id: "business_purpose", label: "Detailed Business Activity Description (Required for State Filing)", type: "text", placeholder: "e.g., Interstate long-haul freight logistics and hotshot delivery" },
            { id: "owner_one_name", label: "Primary Member Full Legal Name", type: "text", placeholder: "First Name, Middle Initial, Last Name" },
            { id: "owner_one_address", label: "Primary Member Physical Residential Address", type: "text", placeholder: "Street, City, State, ZIP (No P.O. Boxes)" },
            { id: "owner_one_share", label: "Primary Member Ownership Percentage (%)", type: "text", placeholder: "e.g., 100% or 50%" },
            { id: "owner_two_name", label: "Secondary Member Full Name (Leave blank if Single-Member)", type: "text", placeholder: "Full Legal Name" },
            { id: "owner_two_share", label: "Secondary Member Ownership Percentage (%)", type: "text", placeholder: "e.g., 50% (If applicable)" },
            { id: "management_structure", label: "Corporate Management Designation", type: "select", options: ["Member-Managed (Owners run day-to-day operations)", "Manager-Managed (Appointed officers/external directors run operations)"] }
        ]
    },
    "corporations": {
        title: "C-Corp / S-Corp Incorporation Terminal",
        description: "Draft official corporate bylaws and stock distribution metrics required to register a legal stock corporation framework.",
        prices: { starter: 149.00, compliance: 249.00, enterprise: 449.00 },
        extraFields: [
            { id: "corp_state", label: "State of Incorporation", type: "text", placeholder: "e.g., Delaware" },
            { id: "tax_classification", label: "Desired IRS Tax Classification", type: "select", options: ["C-Corporation (Standard double-taxation corporate entity)", "S-Corporation (Pass-through small business election - Form 2553)"] },
            { id: "shares_count", label: "Total Number of Authorized Stock Shares to Mint", type: "text", placeholder: "e.g., 10,000 shares" },
            { id: "share_value", label: "Par Value Per Share ($)", type: "text", placeholder: "e.g., $0.01 or No Par Value" },
            { id: "president_name", label: "Appointed Corporate President / CEO", type: "text", placeholder: "Full Legal Name" },
            { id: "secretary_name", label: "Appointed Corporate Secretary", type: "text", placeholder: "Full Legal Name" },
            { id: "corp_address", label: "Official Principal Corporate Headquarters Address", type: "text", placeholder: "Street, City, State, ZIP" }
        ]
    },
    "dba-registration": {
        title: "DBA (Doing Business As) Assumed Name Terminal",
        description: "Register an official fictitious name trade path linked directly to your underlying baseline operating entity.",
        prices: { starter: 49.00, compliance: 99.00, enterprise: 249.00 },
        extraFields: [
            { id: "dba_name", label: "Requested Assumed / Fictitious Trade Name", type: "text", placeholder: "e.g., Fast Mile Freight Services" },
            { id: "dba_county", label: "County or Parish where business will be conducted", type: "text", placeholder: "e.g., Cook County, Harris County" },
            { id: "parent_type", label: "Underlying Parent Structure Type", type: "select", options: ["Existing LLC or Corporation", "Sole Proprietor / Individual Owner"] }
        ]
    },
    "nonprofit": {
        title: "Nonprofit Organization 501(c)(3) Formation Terminal",
        description: "Establish dedicated exempt bylaws and strict corporate asset dissolution structural terms required for state and IRS approval.",
        prices: { starter: 199.00, compliance: 299.00, enterprise: 499.00 },
        extraFields: [
            { id: "nonprofit_purpose", label: "Specific Exempt Mission / Purpose", type: "select", options: ["Charitable Organization", "Religious / Church Infrastructure", "Educational / School / Research", "Scientific / Literary Advancement"] },
            { id: "director_one", label: "Board Director 1 Full Name (Minimum 3 Required by IRS)", type: "text", placeholder: "Board Member 1 Legal Name" },
            { id: "director_two", label: "Board Director 2 Full Name", type: "text", placeholder: "Board Member 2 Legal Name" },
            { id: "director_three", label: "Board Director 3 Full Name", type: "text", placeholder: "Board Member 3 Legal Name" }
        ]
    },
    "sole-proprietorship": {
        title: "Sole Proprietorship Local Compliance Setup",
        description: "Verify local trading routes and register localized trading footprints for single-owner operations.",
        prices: { starter: 39.00, compliance: 79.00, enterprise: 199.00 },
        extraFields: [
            { id: "proprietor_name", label: "Owner Full Legal Name", type: "text", placeholder: "First, Middle, Last" },
            { id: "proprietor_ssn", label: "Owner Social Security Number (SSN)", type: "text", placeholder: "000-00-0000" },
            { id: "proprietor_address", label: "Principal Home Operator Physical Address", type: "text", placeholder: "Street, City, State, ZIP" }
        ]
    },
    "operating-agreement": {
        title: "Operating Agreement & Bylaws Custom Drafting",
        description: "Configure dynamic operational mechanics, capital contribution terms, buyout clauses, and asset protection metrics.",
        prices: { starter: 49.00, compliance: 119.00, enterprise: 219.00 },
        extraFields: [
            { id: "capital_amount", label: "Initial Capital Contribution Amount ($)", type: "text", placeholder: "e.g., $1,000 cash" },
            { id: "voting_rules", label: "Approval Threshold for Major Business Amendments", type: "select", options: ["Unanimous Consent (100% agreement required)", "Super Majority (75% agreement required)", "Simple Majority (Over 51% agreement required)"] }
        ]
    },

    // --- CATEGORY 2: CORPORATE COMPLIANCE ---
    "annual-reports": {
        title: "Mandatory Annual Report Renewal Portal",
        description: "Reconcile, audit, and submit state required officer modifications to maintain an active 'In Good Standing' status.",
        prices: { starter: 49.00, compliance: 89.00, enterprise: 189.00 },
        extraFields: [
            { id: "state_file_number", label: "State Secretary Entity Charter / File Number", type: "text", placeholder: "Look up on State Registry" },
            { id: "report_year", label: "Filing Year Cycle", type: "text", placeholder: "2026" },
            { id: "officer_changes", label: "Have there been changes to your officers or address?", type: "select", options: ["No changes - Renew exactly as currently filed", "Yes - Modifications needed (Our team will follow up via email)"] }
        ]
    },
    "business-licenses": {
        title: "Municipal Business License Application Terminal",
        description: "Compile localized geographic compliance data required for county, parish, and city revenue permits.",
        prices: { starter: 99.00, compliance: 149.00, enterprise: 349.00 },
        extraFields: [
            { id: "facility_type", label: "Commercial Facility Operational Class", type: "select", options: ["Commercial Office / Warehouse / Terminal", "Home-Based Dispatch Office", "Retail Storefront / Public Space"] },
            { id: "local_jurisdiction", label: "City & County Names for Facility", type: "text", placeholder: "e.g., City of Chicago, Cook County" }
        ]
    },
    "ein": {
        title: "Federal Employer ID Number (EIN) Processing",
        description: "Secure an official Federal Tax Identification Number directly from the IRS to open commercial bank accounts and process payroll.",
        prices: { starter: 29.00, compliance: 69.00, enterprise: 169.00 },
        extraFields: [
            { id: "ssn_principal", label: "Responsible Party SSN or Existing ITIN", type: "text", placeholder: "000-00-0000 (Required by IRS to process Form SS-4)" },
            { id: "has_employees", label: "Do you plan to hire W2 employees within the next 12 months?", type: "select", options: ["No employees anticipated", "Yes - 1 to 5 employees planned", "Yes - More than 5 employees planned"] }
        ]
    },
    "registered-agent": {
        title: "Statutory Registered Agent Assignment Service",
        description: "Provision an official corporate address interface to receive service of process and state notifications.",
        prices: { starter: 79.00, compliance: 129.00, enterprise: 279.00 },
        extraFields: [
            { id: "target_state", label: "State Requesting Agent Presence", type: "text", placeholder: "e.g., Texas" }
        ]
    },
    "entity-dissolution": {
        title: "Articles of Dissolution Processing Terminal",
        description: "Formally terminate state registration tokens to sever ongoing franchise tax liabilities.",
        prices: { starter: 99.00, compliance: 179.00, enterprise: 329.00 },
        extraFields: [
            { id: "debts_status", label: "Entity Financial Settlement Status", type: "select", options: ["All corporate debts settled and tax liabilities zeroed", "Settle final obligations through this filing process"] }
        ]
    },
    "licenses-permits": {
        title: "Specialty Industry Licenses & Permits Audit",
        description: "Identify and apply for specialty state jurisdictional operating mandates.",
        prices: { starter: 99.00, compliance: 199.00, enterprise: 399.00 },
        extraFields: [
            { id: "industry_class", label: "Specific Industry Classification", type: "select", options: ["Transportation / Logistics / Hazmat", "Construction / Contracting", "Food Service / Hospitality", "Professional Consulting / Services"] }
        ]
    },
    
    "heavy-use-tax": {
        title: "Heavy Use Vehicle Tax (IRS Form 2290)",
        description: "Process IRS Form 2290 parameters to generate your stamped Schedule 1 watermark for heavy logistics equipment.",
        prices: { starter: 69.00, compliance: 139.00, enterprise: 289.00 },
        extraFields: [
            { id: "ein_number", label: "Employer Identification Number (EIN) - IRS Rules forbid SSNs here", type: "text", placeholder: "12-3456789" },
            { id: "vin_number", label: "Vehicle Identification Number (VIN)", type: "text", placeholder: "17-Character Alphanumeric String" },
            { id: "taxable_gross_weight", label: "Vehicle Gross Taxable Weight (LBS)", type: "select", options: ["75,000+ lbs (Category V)", "55,000 - 74,999 lbs", "Under 55,000 lbs (Exempt / Logging)"] },
            { id: "logging_vehicle", label: "Is this vehicle used exclusively for logging?", type: "select", options: ["No - Standard Commercial Highway Vehicle", "Yes - Logging Vehicle Exemption Rules Apply"] }
        ]
    },
    "federal-income-tax": {
        title: "Federal Income Tax Corporate Registration",
        description: "Map your underlying accounting framework to federal corporate return structures to satisfy annual filing mandates.",
        prices: { starter: 199.00, compliance: 349.00, enterprise: 599.00 },
        extraFields: [
            { id: "tax_form_type", label: "Federal Return Layout Framework", type: "select", options: ["Form 1120 (Standard C-Corporation Return)", "Form 1120S (Small Business S-Corp Pass-Through)", "Form 1065 (Partnership / Multi-Member LLC Ledger)"] },
            { id: "accounting_method", label: "Corporate Accounting Method", type: "select", options: ["Cash Method (Recorded when money exchanges hands)", "Accrual Method (Recorded when transactions occur)"] }
        ]
    },
    "state-income-tax": {
        title: "State Income & Franchise Tax Setup",
        description: "Configure registration links to process mandatory state privilege calculations and corporate state margin returns.",
        prices: { starter: 99.00, compliance: 199.00, enterprise: 349.00 },
        extraFields: [
            { id: "state_tax_id", label: "State Revenue Department Account Number", type: "text", placeholder: "Enter State Tax Account ID" },
            { id: "franchise_reporting", label: "Filing Frequency Profile", type: "select", options: ["Annual Franchise Reporting", "Quarterly Estimated State Margin Tracking"] }
        ]
    },
    "sales-tax": {
        title: "Sales Tax Authorization Registration",
        description: "Secure state resale certificates and transaction tax authority profiles to legally collect sales tax from consumers.",
        prices: { starter: 59.00, compliance: 129.00, enterprise: 279.00 },
        extraFields: [
            { id: "nexus_states", label: "Target State for Sales Tax Authority Connection", type: "text", placeholder: "e.g., Texas" },
            { id: "product_type", label: "Primary Tangible Personal Property/Service Sold", type: "text", placeholder: "e.g., Physical Goods, SaaS Software, Digital Products" }
        ]
    },
    "payroll-tax": {
        title: "Payroll Withholding Tax Setup (940/941)",
        description: "Establish accounting links to track Federal Unemployment (940) and quarterly employee tax withholding logs (941).",
        prices: { starter: 79.00, compliance: 159.00, enterprise: 309.00 },
        extraFields: [
            { id: "expected_employees", label: "Estimated Total W2 Employees on Payroll", type: "text", placeholder: "e.g., 5" },
            { id: "first_payroll_date", label: "Anticipated Date of First Wage Payment", type: "text", placeholder: "MM/DD/YYYY" }
        ]
    },
    "franchise-tax": {
        title: "Franchise Tax Access Reconciliation",
        description: "Calculate and submit corporate privilege fees based on your state's authorized capitalization layout models.",
        prices: { starter: 59.00, compliance: 119.00, enterprise: 249.00 },
        extraFields: [
            { id: "charter_number", label: "State Corporate Charter / File Number", type: "text", placeholder: "e.g., C0123456" }
        ]
    },

    // --- CATEGORY 4: TRUCKING AUTHORITY & FLEET COMPLIANCE ---
    "owner-operators": {
        title: "Owner-Operator Fleet Compliance Link",
        description: "Consolidate corporate structure configurations and lease compliance parameters for independent logistics contractors.",
        prices: { starter: 99.00, compliance: 189.00, enterprise: 389.00 },
        extraFields: [
            { id: "leased_to_carrier", label: "Are you leased to an established carrier fleet?", type: "select", options: ["No - Operating Under My Own Independent Authority", "Yes - Leased onto an Existing Motor Carrier Network"] },
            { id: "primary_carrier_dot", label: "Leasing Carrier USDOT Number (If applicable)", type: "text", placeholder: "e.g., 1234567" }
        ]
    },
    "trucker-authority": {
        title: "Interstate Trucker Operating Authority (MC/USDOT)",
        description: "Secure active federal MC and USDOT credentials required by the FMCSA to operate interstate for-hire commerce.",
        prices: { starter: 299.00, compliance: 499.00, enterprise: 799.00 },
        extraFields: [
            { id: "existing_dot", label: "Existing USDOT Number (Leave blank if brand new)", type: "text", placeholder: "e.g., 1234567" },
            { id: "cargo_type", label: "Primary Cargo Vector Classification", type: "select", options: ["General Freight", "Refrigerated Goods / Produce", "Hazmat / Chemical Tankers", "Intermodal Containers", "Cars / Auto Hauling"] },
            { id: "equipment_count", label: "Total Commercial Power Units (Trucks) in Fleet", type: "text", placeholder: "e.g., 1" },
            { id: "driver_cdl_count", label: "Total Inter-State CDL Drivers operating vehicles", type: "text", placeholder: "e.g., 1" }
        ]
    },
    "broker-authority": {
        title: "Property Broker Operating Authority (FMCSA)",
        description: "Secure a federal property broker authority license. Requires processing public filings and a $75,000 security bond.",
        prices: { starter: 279.00, compliance: 479.00, enterprise: 779.00 },
        extraFields: [
            { id: "broker_type", label: "Broker Operational Profile Classification", type: "select", options: ["Broker of Property (Standard dry van/reefer freight)", "Broker of Household Goods Only (Moving companies)"] },
            { id: "bond_type_pref", label: "Preferred Security Instrument Configuration", type: "select", options: ["BMC-84 Surety Bond (Annual Premium Option)", "BMC-85 Trust Fund ($75,000 Cash collateralized trust)"] }
        ]
    },
    "dot-consortium": {
        title: "DOT Random Drug & Alcohol Consortium Enrollment",
        description: "Enroll commercial drivers into fully compliant FMCSA random selection testing pool arrays to satisfy 49 CFR Part 382 guidelines.",
        prices: { starter: 69.00, compliance: 129.00, enterprise: 249.00 },
        extraFields: [
            { id: "driver_full_name", label: "Driver Full Legal Name for Pool Addition", type: "text", placeholder: "First, Middle, Last" },
            { id: "driver_license_id", label: "Driver CDL Number & State of Issue", type: "text", placeholder: "e.g., DL1234567 - IL" },
            { id: "clearinghouse_id", label: "FMCSA Drug & Alcohol Clearinghouse Driver Portal ID", type: "text", placeholder: "Driver's Clearinghouse ID" }
        ]
    },
    "driver-qualification": {
        title: "Driver Qualification File (DQF) Compliance Tracking",
        description: "Compile background verification metrics, safety performance records, and medical checks required for compliance auditing.",
        prices: { starter: 49.00, compliance: 99.00, enterprise: 199.00 },
        extraFields: [
            { id: "operator_dob", label: "Driver Date of Birth", type: "text", placeholder: "MM/DD/YYYY" },
            { id: "med_card_expiry", label: "DOT Medical Examiner Certificate Expiration Date", type: "text", placeholder: "MM/DD/YYYY" },
            { id: "three_year_mvr", label: "Does driver have a clean 3-Year Motor Vehicle Record (MVR)?", type: "select", options: ["Yes - Clean background check history log", "No - Violations present on record profile"] }
        ]
    },
    "ucr-registration": {
        title: "Unified Carrier Registration (UCR) Filing Terminal",
        description: "Process current calendar year unified state vehicle compliance credentials based on total active fleet counts.",
        prices: { starter: 59.00, compliance: 119.00, enterprise: 269.00 },
        extraFields: [
            { id: "dot_number_ucr", label: "Active Operating USDOT Number", type: "text", placeholder: "e.g., 1234567" },
            { id: "fleet_size_tier", label: "Total Commercial Fleet Size Bracket", type: "select", options: ["0 - 2 Commercial Vehicles", "3 - 5 Commercial Vehicles", "6 - 20 Commercial Vehicles", "21 - 100 Commercial Vehicles", "101+ Commercial Vehicles"] }
        ]
    },
    "process-agent": {
        title: "Process Agent Service (BOC-3 Filing Engine)",
        description: "Formally attach certified blanket agents across all 50 operating states to satisfy FMCSA active status mandates.",
        prices: { starter: 39.00, compliance: 79.00, enterprise: 149.00 },
        extraFields: [
            { id: "mc_number_boc3", label: "Filing Motor Carrier (MC) or FF Number", type: "text", placeholder: "e.g., MC-123456" },
            { id: "legal_signer_title", label: "Authorized Signer Title", type: "select", options: ["Owner / Principal", "Managing Member", "Corporate Officer", "Authorized Representative"] }
        ]
    },
    "ifta-registration": {
        title: "International Fuel Tax Agreement Account Setup",
        description: "Secure your master IFTA base account credentials and order annual vehicle operations decals to track multi-jurisdiction mileage.",
        prices: { starter: 89.00, compliance: 169.00, enterprise: 319.00 },
        extraFields: [
            { id: "base_jurisdiction", label: "Base Operations State (Home Garage Terminal)", type: "text", placeholder: "e.g., Illinois" },
            { id: "irp_account", label: "International Registration Plan (IRP) Account Number", type: "text", placeholder: "Enter Apportioned Tag Account Number" }
        ]
    },

    // --- CATEGORY 5: COMMERCIAL RISK INSURANCE ---
    "trucker-insurance": {
        title: "Commercial Trucker Liability Insurance Placement",
        description: "Initiate risk underwriting routing to secure commercial auto liability, motor truck cargo, and physical damage policy options.",
        prices: { starter: 149.00, compliance: 299.00, enterprise: 549.00 },
        extraFields: [
            { id: "radius_miles", label: "Primary Operating Radius Parameters", type: "select", options: ["Interstate (Unlimited / 50-State OTR)", "Regional (Under 500 Mile Radius)", "Local (Under 100 Mile Radius Only)"] },
            { id: "prior_insurance", label: "Have you had commercial insurance in the past 3 years?", type: "select", options: ["No - Brand new venture startup profile", "Yes - Continuous coverage with no major lapses"] },
            { id: "target_liability_limit", label: "Requested Auto Liability Cover Limit", type: "select", options: ["$1,000,000 (Standard Broker Minimum Requirement)", "$750,000 (FMCSA Legal Minimum for Freight)", "$2,000,000+ Specialized Over-Sized Cargo limits"] }
        ]
    },
    "broker-insurance": {
        title: "Freight Broker BMC-84 Bond & Risk Structuring",
        description: "Process applications for the mandatory $75,000 FMCSA financial security bond to activate freight broker operations.",
        prices: { starter: 129.00, compliance: 249.00, enterprise: 499.00 },
        extraFields: [
            { id: "credit_tier_est", label: "Self-Estimated Principal Credit Profile Tier", type: "select", options: ["Excellent (720+ FICO Profile)", "Good (660 - 719 FICO Profile)", "Fair / Rebuilding (Under 660 FICO Profile)"] },
            { id: "has_experience", label: "Principal Owner has active logistics/trucking experience?", type: "select", options: ["Yes - 2+ Years industry background experience", "No - Entry-level asset management profile"] }
        ]
    }

}

/* ==========================================================================
   📦 FILINGS4U GLOBAL UPSELL INFRASTRUCTURE DICTIONARY
   ========================================================================== */
window.UPSELL_REGISTRY = {
    "registered-agent": { title: "1-Year Premium Registered Agent Service", price: 129.00, desc: "Mandatory statutory address presence to receive service of process and state notices." },
    "operating-agreement": { title: "Custom Operating Agreement & Corporate Bylaws", price: 119.00, desc: "Drafts corporate governance structures, asset protection rules, and banking resolutions." },
    "ein-number": { title: "Federal Employer ID Number (EIN) Fast-Track", price: 69.00, desc: "Procures an official IRS Tax ID within 24 business hours to open banking files." },
    "corporate-resolutions": { title: "Corporate Resolutions & Meeting Minutes Framework", price: 49.00, desc: "Establishes initial corporate organization structures, opening minutes, and signing permissions." }
};
