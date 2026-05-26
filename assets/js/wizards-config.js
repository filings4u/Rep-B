window.WIZARD_REGISTRY = {
    /* ==========================================================================
       📊 TRACK 01: BUSINESS FORMATION & STRUCTURE MODULES
       ========================================================================== */
    "limited-liability-company": {
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
            { id: "management_structure", label: "Corporate Management Designation", type: "select", options: ["Member-Managed (Owners run day-to-day operations)", "Manager-Managed (Appointed officers/external directors run operations)"] },
            { id: "llc_backup_name", label: "Alternative Backup Entity Name (If Primary Choice is Taken)", type: "text", placeholder: "e.g., Filings Logistics Group LLC" },
            { id: "llc_duration_term", label: "Entity Lifespan / Lifecyle Duration", type: "select", options: ["Perpetual (Entity lasts forever unless formal dissolution occurs)", "Specific Term (Entity dissolves automatically on a chosen date)"] },
            { id: "llc_executing_organizer", label: "Authorized Organizer Electronic Signature", type: "text", placeholder: "Type Full Name to authorize filing execution" }
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
            { id: "corp_address", label: "Official Principal Corporate Headquarters Address", type: "text", placeholder: "Street, City, State, ZIP" },
            { id: "corp_treasurer_name", label: "Appointed Corporate Treasurer Full Legal Name", type: "text", placeholder: "Full Legal Name" },
            { id: "corp_initial_board", label: "List Board of Directors (Full Names & Office Addresses)", type: "text", placeholder: "Director 1, Director 2 (Separated by commas)" },
            { id: "corp_bylaws_clause", label: "Do you require generic standard indemnification clauses inside your charter?", type: "select", options: ["Yes - Include standard director protection liability clauses", "No - Rely on standard basic state legal defaults"] }
        ]
    },
    "sole-proprietorship": {
        title: "Sole Proprietorship Local Compliance Setup",
        description: "Verify local trading routes and register localized trading footprints for single-owner operations.",
        prices: { starter: 39.00, compliance: 79.00, enterprise: 199.00 },
        extraFields: [
            { id: "proprietor_name", label: "Owner Full Legal Name", type: "text", placeholder: "First, Middle, Last" },
            { id: "proprietor_ssn", label: "Owner Social Security Number (SSN)", type: "text", placeholder: "000-00-0000" },
            { id: "proprietor_address", label: "Principal Home Operator Physical Address", type: "text", placeholder: "Street, City, State, ZIP" },
            { id: "proprietor_dob", label: "Owner Date of Birth", type: "text", placeholder: "MM/DD/YYYY" },
            { id: "proprietor_trade_name", label: "Intended Commercial Trading Name (If using any)", type: "text", placeholder: "Leave blank if trading purely under legal name" }
        ]
    },
    "doing-business-as-dba": {
        title: "DBA (Doing Business As) Assumed Name Terminal",
        description: "Register an official fictitious name trade path linked directly to your underlying baseline operating entity.",
        prices: { starter: 49.00, compliance: 99.00, enterprise: 249.00 },
        extraFields: [
            { id: "dba_name", label: "Requested Assumed / Fictitious Trade Name", type: "text", placeholder: "e.g., Fast Mile Freight Services" },
            { id: "dba_county", label: "County or Parish where business will be conducted", type: "text", placeholder: "e.g., Cook County, Harris County" },
            { id: "parent_type", label: "Underlying Parent Structure Type", type: "select", options: ["Existing LLC or Corporation", "Sole Proprietor / Individual Owner"] },
            { id: "parent_company_legal_name", label: "Official Parent Entity Legal Name (If LLC/Corp)", type: "text", placeholder: "Matches state registration documentation exactly" },
            { id: "dba_nature_of_trade", label: "Detailed Description of Products/Services Sold Under This DBA", type: "text", placeholder: "Describe exact commercial trade activities..." },
            { id: "dba_state_scope", label: "Filing Level Jurisdiction", type: "select", options: ["Statewide Registration Desk", "County Clerk Filing Desk Only"] }
        ]
    },
    "nonprofits": {
        title: "Nonprofit Organization 501(c)(3) Formation Terminal",
        description: "Establish dedicated exempt bylaws and strict corporate asset dissolution structural terms required for state and IRS approval.",
        prices: { starter: 199.00, compliance: 299.00, enterprise: 499.00 },
        extraFields: [
            { id: "nonprofit_purpose", label: "Specific Exempt Mission / Purpose", type: "select", options: ["Charitable Organization", "Religious / Church Infrastructure", "Educational / School / Research", "Scientific / Literary Advancement"] },
            { id: "director_one", label: "Board Director 1 Full Name (Minimum 3 Required by IRS)", type: "text", placeholder: "Board Member 1 Legal Name" },
            { id: "director_two", label: "Board Director 2 Full Name", type: "text", placeholder: "Board Member 2 Legal Name" },
            { id: "director_three", label: "Board Director 3 Full Name", type: "text", placeholder: "Board Member 3 Legal Name" },
            { id: "np_director_addresses", label: "Complete Physical Addresses for Directors 1, 2, and 3", type: "text", placeholder: "Director 1 Address | Director 2 Address | Director 3 Address" },
            { id: "np_dissolution_clause", label: "Dissolution Asset Allocation (Name target 501c3 group or agency)", type: "text", placeholder: "Where do corporate assets go if organization shuts down?" },
            { id: "np_voting_members", label: "Does this nonprofit organization have regular voting members?", type: "select", options: ["No - Purely board managed structure rules", "Yes - Assemblies hold explicit voting rights"] }
        ]
    },
    "series-llc": {
        title: "Series LLC Structured Asset Segmentation Terminal",
        description: "Isolate individual high-risk assets, real estate parcels, or independent truck units into protected master cells under an umbrella structure.",
        prices: { starter: 199.00, compliance: 299.00, enterprise: 549.00 },
        extraFields: [
            { id: "series_master_state", label: "Master Structure Formation State", type: "text", placeholder: "e.g., Delaware, Texas, Wyoming, Nevada" },
            { id: "initial_cells_count", label: "Total Number of Protected Sub-Series Cells to Launch", type: "text", placeholder: "e.g., 3 cells" },
            { id: "series_cell_naming_pattern", label: "Intended Sub-Cell Naming Scheme Structure", type: "text", placeholder: "e.g., Master Logistics LLC - Series A, Series B" },
            { id: "series_purpose", label: "Primary Operations Segmented by Series Cells", type: "text", placeholder: "e.g., Series A for Truck Units, Series B for Real Estate Holdings" }
        ]
    },

    /* ==========================================================================
       📊 TRACK 02: CORPORATE GOVERNANCE & CORE COMPLIANCE MODULES
       ========================================================================== */
    "annual-reports": {
        title: "Mandatory Annual Report Renewal Portal",
        description: "Reconcile, audit, and submit state required officer modifications to maintain an active 'In Good Standing' status.",
        prices: { starter: 49.00, compliance: 89.00, enterprise: 189.00 },
        extraFields: [
            { id: "state_file_number", label: "State Secretary Entity Charter / File Number", type: "text", placeholder: "Look up on State Registry" },
            { id: "report_year", label: "Filing Year Cycle", type: "text", placeholder: "2026" },
            { id: "officer_changes", label: "Have there been changes to your officers or address?", type: "select", options: ["No changes - Renew exactly as currently filed", "Yes - Modifications needed (Our team will follow up via email)"] },
            { id: "current_principal_office", label: "Current Active Principal Business Office Address", type: "text", placeholder: "Street, Suite, City, State, ZIP" }
        ]
    },
    "operating-agreement": {
        title: "Operating Agreement & Bylaws Custom Drafting",
        description: "Configure dynamic operational mechanics, capital contribution terms, buyout clauses, and asset protection metrics.",
        prices: { starter: 49.00, compliance: 119.00, enterprise: 219.00 },
        extraFields: [
            { id: "capital_amount", label: "Initial Capital Contribution Amount ($)", type: "text", placeholder: "e.g., $1,000 cash" },
            { id: "voting_rules", label: "Approval Threshold for Major Business Amendments", type: "select", options: ["Unanimous Consent (100% agreement required)", "Super Majority (75% agreement required)", "Simple Majority (Over 51% agreement required)"] },
            { id: "capital_assets_desc", label: "Description of Non-Cash Capital Contributions (If Any)", type: "text", placeholder: "e.g., Fleet Vehicles, Equipment, Intellectual Property" },
            { id: "buyout_terms", label: "Do you require strict restriction clauses governing member ownership buyouts?", type: "select", options: ["Yes - Include Right of First Refusal protective structures", "No - Free transfer of member equity blocks allowed"] }
        ]
    },
    "registered-agent": {
        title: "Statutory Registered Agent Assignment Service",
        description: "Provision an official corporate address interface to receive service of process and state notifications.",
        prices: { starter: 79.00, compliance: 129.00, enterprise: 279.00 },
        extraFields: [
            { id: "target_state", label: "State Requesting Agent Presence", type: "text", placeholder: "e.g., Texas" },
            { id: "current_agent_on_file", label: "Name of Current Agent on File (Write 'None' if new company)", type: "text", placeholder: "Entity name or previous provider string" }
        ]
    },
    "business-licenses": {
        title: "Municipal Business License Application Terminal",
        description: "Compile localized geographic compliance data required for county, parish, and city revenue permits.",
        prices: { starter: 99.00, compliance: 149.00, enterprise: 349.00 },
        extraFields: [
            { id: "facility_type", label: "Commercial Facility Operational Class", type: "select", options: ["Commercial Office / Warehouse / Terminal", "Home-Based Dispatch Office", "Retail Storefront / Public Space"] },
            { id: "local_jurisdiction", label: "City & County Names for Facility", type: "text", placeholder: "e.g., City of Chicago, Cook County" },
            { id: "facility_square_footage", label: "Estimated Square Footage of Operating Space", type: "text", placeholder: "e.g., 2,500 sqft" },
            { id: "employees_at_location", label: "Total Number of Active Staff Members at This Location", type: "text", placeholder: "e.g., 4" }
        ]
    },
    "employer-identification-number-ein": {
        title: "Federal Employer ID Number (EIN) Processing",
        description: "Secure an official Federal Tax Identification Number directly from the IRS to open commercial bank accounts and process payroll.",
        prices: { starter: 29.00, compliance: 69.00, enterprise: 169.00 },
        extraFields: [
            { id: "ssn_principal", label: "Responsible Party SSN or Existing ITIN", type: "text", placeholder: "000-00-0000 (Required by IRS to process Form SS-4)" },
            { id: "has_employees", label: "Do you plan to hire W2 employees within the next 12 months?", type: "select", options: ["No employees anticipated", "Yes - 1 to 5 employees planned", "Yes - More than 5 employees planned"] },
            { id: "ein_reason_code", label: "Primary Reason for Requesting Tax ID", type: "select", options: ["Started a brand new business entity", "Opened banking account pipeline", "Hired employees", "Banking/Compliance updates"] }
        ]
    },
    "dissolution": {
        title: "Articles of Dissolution Processing Terminal",
        description: "Formally terminate state registration tokens to sever ongoing franchise tax liabilities.",
        prices: { starter: 99.00, compliance: 179.00, enterprise: 329.00 },
        extraFields: [
            { id: "debts_status", label: "Entity Financial Settlement Status", type: "select", options: ["All corporate debts settled and tax liabilities zeroed", "Settle final obligations through this filing process"] },
            { id: "dissolution_charter_id", label: "State Entity ID / Secretary Charter Number", type: "text", placeholder: "Look up on state business index" },
            { id: "unanimous_consent_dissolved", label: "Has the entity dissolution been approved by all owners?", type: "select", options: ["Yes - Unanimous written member consent is fully signed", "No - Resolution is currently pending final sign-off"] }
        ]
    },


     /* ==========================================================================
       📊 TRACK 03: TAX REGISTRATIONS & FILINGS MODULES
       ========================================================================== */
    "federal-income-tax": {
        title: "Federal Income Tax Corporate Registration",
        description: "Map your underlying accounting framework to federal corporate return structures to satisfy annual filing mandates.",
        prices: { starter: 199.00, compliance: 349.00, enterprise: 599.00 },
        extraFields: [
            { id: "tax_form_type", label: "Federal Return Layout Framework", type: "select", options: ["Form 1120 (Standard C-Corporation Return)", "Form 1120S (Small Business S-Corp Pass-Through)", "Form 1065 (Partnership / Multi-Member LLC Ledger)"] },
            { id: "accounting_method", label: "Corporate Accounting Method", type: "select", options: ["Cash Method (Recorded when money exchanges hands)", "Accrual Method (Recorded when transactions occur)"] },
            { id: "business_ein_reference", label: "Active Business Tax Identification ID (EIN)", type: "text", placeholder: "XX-XXXXXXX" }
        ]
    },
    "state-income-tax": {
        title: "State Income & Franchise Tax Setup",
        description: "Configure registration links to process mandatory state privilege calculations and corporate state margin returns.",
        prices: { starter: 99.00, compliance: 199.00, enterprise: 349.00 },
        extraFields: [
            { id: "state_tax_id", label: "State Revenue Department Account Number", type: "text", placeholder: "Enter State Tax Account ID" },
            { id: "franchise_reporting", label: "Filing Frequency Profile", type: "select", options: ["Annual Franchise Reporting", "Quarterly Estimated State Margin Tracking"] },
            { id: "revenue_target_state", label: "Target State Revenue Office Jurisdiction", type: "text", placeholder: "e.g., California FTB, Texas Comptroller" }
        ]
    },
    "franchise-tax": {
        title: "Franchise Tax Access Reconciliation",
        description: "Calculate and submit corporate privilege fees based on your state's authorized capitalization layout models to safeguard your operational active standing metrics.",
        prices: { starter: 59.00, compliance: 119.00, enterprise: 249.00 },
        extraFields: [
            { id: "charter_number", label: "State Corporate Charter / File Number", type: "text", placeholder: "e.g., C0123456" },
            { id: "fran_filing_state", label: "State Demanding Franchise Fee Reconciliation", type: "text", placeholder: "e.g., Delaware" },
            { id: "reporting_year_period", label: "Franchise Tax Filing Assessment Year", type: "text", placeholder: "e.g., 2026" },
            { id: "gross_assets_value", label: "Total Worldwide Gross Assets ($ Amount)", type: "text", placeholder: "Leave blank if flat-rate jurisdiction" },
            { id: "shares_issued_count", label: "Total Issued Shares on Record (If Corporation)", type: "text", placeholder: "Check your initial stock book logs" }
        ]
    },
    "sales-tax-registration": {
        title: "Sales Tax Authorization Registration",
        description: "Secure state resale certificates and transaction tax authority profiles to legally collect sales tax from consumers.",
        prices: { starter: 59.00, compliance: 129.00, enterprise: 279.00 },
        extraFields: [
            { id: "nexus_states", label: "Target State for Sales Tax Authority Connection", type: "text", placeholder: "e.g., Texas" },
            { id: "product_type", label: "Primary Tangible Personal Property/Service Sold", type: "text", placeholder: "e.g., Physical Goods, SaaS Software, Digital Products" },
            { id: "sales_commence_date", label: "Date Sales/Revenue Operations First Commenced in This State", type: "text", placeholder: "MM/DD/YYYY" }
        ]
    },
    "payroll-tax-940-941": {
        title: "Payroll Withholding Tax Setup (940/941)",
        description: "Establish accounting links to track Federal Unemployment (940) and quarterly employee tax withholding logs (941). Ensures complete documentation of state payroll tax accounts and IRS withholding configurations.",
        prices: { starter: 79.00, compliance: 159.00, enterprise: 309.00 },
        extraFields: [
            { id: "expected_employees", label: "Estimated Total W2 Employees on Payroll", type: "text", placeholder: "e.g., 5" },
            { id: "first_payroll_date", label: "Anticipated Date of First Wage Payment", type: "text", placeholder: "MM/DD/YYYY" },
            { id: "payroll_frequency", label: "Intended Employee Pay Cycle Frequency", type: "select", options: ["Weekly Processing", "Bi-Weekly (Every 2 Weeks)", "Semi-Monthly (Twice Per Month)", "Monthly Accounting Cycle"] },
            { id: "payroll_provider_type", label: "Internal Payroll Management Structure", type: "select", options: ["Self-Managed Platform (QuickBooks/Gusto)", "Third-Party CPA / Professional Firm", "Filings4u Managed Bookkeeping Network"] },
            { id: "estimated_annual_wages", label: "Estimated Annual Gross Wages Box ($)", type: "text", placeholder: "e.g., $150,000" }
        ]
    },
    "heavy-use-tax-2290": {
        title: "Heavy Use Vehicle Tax (IRS Form 2290)",
        description: "Process IRS Form 2290 parameters to generate your stamped Schedule 1 watermark for heavy logistics equipment.",
        prices: { starter: 69.00, compliance: 139.00, enterprise: 289.00 },
        extraFields: [
            { id: "ein_number", label: "Employer Identification Number (EIN) - IRS Rules forbid SSNs here", type: "text", placeholder: "12-3456789" },
            { id: "vin_number", label: "Vehicle Identification Number (VIN)", type: "text", placeholder: "17-Character Alphanumeric String" },
            { id: "taxable_gross_weight", label: "Vehicle Gross Taxable Weight (LBS)", type: "select", options: ["75,000+ lbs (Category V)", "55,000 - 74,999 lbs", "Under 55,000 lbs (Exempt / Logging)"] },
            { id: "logging_vehicle", label: "Is this vehicle used exclusively for logging?", type: "select", options: ["No - Standard Commercial Highway Vehicle", "Yes - Logging Vehicle Exemption Rules Apply"] },
            { id: "tax_year_cycle_2290", label: "Filing Tax Period Year Cycle", type: "select", options: ["Current Tax Period (July 1 - June 30 Renewal)", "Prior Period Filing Adjustments"] }
        ]
    },

    /* ==========================================================================
       📊 TRACK 04: TRUCKING & LOGISTICS AUTHORITY MODULES
       ========================================================================== */
    "owner-operators": {
        title: "Owner-Operator Fleet Compliance Link",
        description: "Consolidate corporate structure configurations and lease compliance parameters for independent logistics contractors.",
        prices: { starter: 99.00, compliance: 189.00, enterprise: 389.00 },
        extraFields: [
            { id: "leased_to_carrier", label: "Are you leased to an established carrier fleet?", type: "select", options: ["No - Operating Under My Own Independent Authority", "Yes - Leased onto an Existing Motor Carrier Network"] },
            { id: "primary_carrier_dot", label: "Leasing Carrier USDOT Number (If applicable)", type: "text", placeholder: "e.g., 1234567" },
            { id: "oo_equipment_year", label: "Primary Commercial Tractor Vehicle Year", type: "text", placeholder: "e.g., 2022" },
            { id: "oo_equipment_vin", label: "Primary Commercial Tractor Vehicle 17-Digit VIN", type: "text", placeholder: "Alpha-Numeric Operational String" },
            { id: "oo_lease_start_date", label: "Carrier Lease Agreement Execution Date", type: "text", placeholder: "MM/DD/YYYY (Leave blank if independent)" },
            { id: "oo_base_plate_state", label: "Apportioned IRP Base Plate Registration State", type: "text", placeholder: "e.g., Texas" }
        ]
    },
    "trucker-authority": {
        title: "Interstate Trucker Operating Authority (MC/USDOT)",
        description: "Secure active federal MC and USDOT credentials required by the FMCSA to operate interstate for-hire commerce safely across all domestic corridors.",
        prices: { starter: 299.00, compliance: 499.00, enterprise: 799.00 },
        extraFields: [
            { id: "existing_dot", label: "Existing USDOT Number (Leave blank if brand new)", type: "text", placeholder: "e.g., 1234567" },
            { id: "cargo_type", label: "Primary Cargo Vector Classification", type: "select", options: ["General Freight", "Refrigerated Goods / Produce", "Hazmat / Chemical Tankers", "Intermodal Containers", "Cars / Auto Hauling"] },
            { id: "equipment_count", label: "Total Commercial Power Units (Trucks) in Fleet", type: "text", placeholder: "e.g., 1" },
            { id: "driver_cdl_count", label: "Total Inter-State CDL Drivers operating vehicles", type: "text", placeholder: "e.g., 1" },
            { id: "ta_ein_reference", label: "Filing Company Tax ID (EIN)", type: "text", placeholder: "XX-XXXXXXX" },
            { id: "ta_fmcsa_class", label: "OP-1 Regulatory Operating Classification", type: "select", options: ["Motor Common Carrier of Property (except Household Goods)", "Motor Contract Carrier of Property (except Household Goods)", "Motor Common Carrier of Household Goods"] },
            { id: "ta_safety_contact", label: "Designated Safety Director / Contact Name", type: "text", placeholder: "First & Last Name" },
            { id: "ta_highest_gvwr", label: "Highest Gross Vehicle Weight Rating (GVWR) Expected", type: "select", options: ["Class 8 Heavy Haulers (Over 26,001 lbs)", "Class 3-6 Medium Duty Trucks (10,001 to 26,000 lbs)", "Light Hotshot Delivery Class (Under 10,000 lbs)"] }
        ]
    },
    "broker-authority": {
        title: "Property Broker Operating Authority (FMCSA)",
        description: "Secure a federal property broker authority license. Requires processing public filing declarations and coordinating a $75,000 BMC-84 financial security bond.",
        prices: { starter: 279.00, compliance: 479.00, enterprise: 779.00 },
        extraFields: [
            { id: "broker_type", label: "Broker Operational Profile Classification", type: "select", options: ["Broker of Property (Standard dry van/reefer freight)", "Broker of Household Goods Only (Moving companies)"] },
            { id: "bond_type_pref", label: "Preferred Security Instrument Configuration", type: "select", options: ["BMC-84 Surety Bond (Annual Premium Option)", "BMC-85 Trust Fund ($75,000 Cash collateralized trust)"] },
            { id: "ba_responsible_party", label: "Principal Broker Officer / Responsible Party", type: "text", placeholder: "Full Legal Name" },
            { id: "ba_phone_number", label: "Brokerage Operations Contact Phone", type: "text", placeholder: "(XXX) XXX-XXXX" },
            { id: "ba_office_address", label: "Principal Brokerage Office Physical Address", type: "text", placeholder: "Street, Unit, City, State, Zip (No P.O. Boxes)" }
        ]
    },
    "ucr-registration": {
        title: "Unified Carrier Registration (UCR) Filing Terminal",
        description: "Process current calendar year unified state vehicle compliance credentials based on total active fleet counts to clear interstate DOT road enforcement restrictions.",
        prices: { starter: 59.00, compliance: 119.00, enterprise: 269.00 },
        extraFields: [
            { id: "dot_number_ucr", label: "Active Operating USDOT Number", type: "text", placeholder: "e.g., 1234567" },
            { id: "fleet_size_tier", label: "Total Commercial Fleet Size Bracket", type: "select", options: ["0 - 2 Commercial Vehicles", "3 - 5 Commercial Vehicles", "6 - 20 Commercial Vehicles", "21 - 100 Commercial Vehicles", "101+ Commercial Vehicles"] },
            { id: "ucr_company_tax_id", label: "Filing Company EIN / Tax ID", type: "text", placeholder: "XX-XXXXXXX" },
            { id: "ucr_registered_year", label: "UCR Target Calendar Year Cycle", type: "select", options: ["Current Calendar Filing Cycle (2026)", "Pre-Audit Outstanding Year Review"] }
        ]
    },
    "process-agents-boc-3": {
        title: "Process Agent Service (BOC-3 Filing Engine)",
        description: "Formally attach certified blanket agents across all 50 operating states to satisfy FMCSA active operating status mandates.",
        prices: { starter: 39.00, compliance: 79.00, enterprise: 149.00 },
        extraFields: [
            { id: "mc_number_boc3", label: "Filing Motor Carrier (MC) or FF Number", type: "text", placeholder: "e.g., MC-123456" },
            { id: "legal_signer_title", label: "Authorized Signer Title", type: "select", options: ["Owner / Principal", "Managing Member", "Corporate Officer", "Authorized Representative"] },
            { id: "boc3_company_name", label: "Legal Business Name matching FMCSA Portal Authority", type: "text", placeholder: "Exact text matching authority file" },
            { id: "boc3_street_address", label: "Principal Place of Business Street Address", type: "text", placeholder: "Street, City, State, Zip (No P.O. Boxes)" }
        ]
    },

    /* ==========================================================================
       📊 TRACK 05: FLEET COMPLIANCE & SAFETY MODULES
       ========================================================================== */
    "dot-consortium": {
        title: "DOT Random Drug & Alcohol Consortium Enrollment",
        description: "Enroll commercial drivers into fully compliant FMCSA random selection testing pool arrays to satisfy 49 CFR Part 382 guidelines.",
        prices: { starter: 69.00, compliance: 129.00, enterprise: 249.00 },
        extraFields: [
            { id: "driver_full_name", label: "Driver Full Legal Name for Pool Addition", type: "text", placeholder: "First, Middle, Last" },
            { id: "driver_license_id", label: "Driver CDL Number & State of Issue", type: "text", placeholder: "e.g., DL1234567 - IL" },
            { id: "clearinghouse_id", label: "FMCSA Drug & Alcohol Clearinghouse Driver Portal ID", type: "text", placeholder: "Driver's Clearinghouse ID" },
            { id: "driver_ssn_fragment", label: "Driver SSN (Last 4 Digits for Lab Reporting)", type: "text", placeholder: "XXXX" },
            { id: "driver_dob_field", label: "Driver Date of Birth", type: "text", placeholder: "MM/DD/YYYY" },
            { id: "driver_hire_date", label: "Driver Employment / Enrollment Start Date", type: "text", placeholder: "MM/DD/YYYY" }
        ]
    },
    "driver-qualification-file": {
        title: "Driver Qualification File (DQF) Compliance Tracking",
        description: "Compile background verification metrics, safety performance records, and medical checks required for compliance auditing under 49 CFR Part 391 rules.",
        prices: { starter: 49.00, compliance: 99.00, enterprise: 199.00 },
        extraFields: [
            { id: "operator_dob", label: "Driver Date of Birth", type: "text", placeholder: "MM/DD/YYYY" },
            { id: "med_card_expiry", label: "DOT Medical Examiner Certificate Expiration Date", type: "text", placeholder: "MM/DD/YYYY" },
            { id: "three_year_mvr", label: "Does driver have a clean 3-Year Motor Vehicle Record (MVR)?", type: "select", options: ["Yes - Clean background check history log", "No - Violations present on record profile"] },
            { id: "dq_license_state", label: "Driver CDL State of Issuance", type: "text", placeholder: "e.g., Florida" },
            { id: "dq_license_num", label: "Driver CDL Alpha-Numeric License ID", type: "text", placeholder: "Enter complete CDL license text" },
            { id: "dq_prev_employers", label: "Prior 3-Year Trucking Employer Logs (Company Name & Phone)", type: "text", placeholder: "List former logistics safety contacts" }
        ]
    },
    "international-fuel-tax-agreement-ifta": {
        title: "International Fuel Tax Agreement Account Setup",
        description: "Secure your master IFTA base account credentials and order annual vehicle operations decals to track multi-jurisdiction fuel mileage distribution profiles.",
        prices: { starter: 89.00, compliance: 169.00, enterprise: 319.00 },
        extraFields: [
            { id: "base_jurisdiction", label: "Base Operations State (Home Garage Terminal)", type: "text", placeholder: "e.g., Illinois" },
            { id: "irp_account", label: "International Registration Plan (IRP) Account Number", type: "text", placeholder: "Enter Apportioned Tag Account Number" },
            { id: "ifta_usdot_ref", label: "Carrier Master USDOT Number", type: "text", placeholder: "e.g., 1234567" },
            { id: "ifta_fuel_type_class", label: "Primary Fleet Engine Fuel Consumption Class", type: "select", options: ["Diesel Fuel Core Engines", "Gasoline Standard Power Units", "Alternative Hybrid / Propane Tracks"] }
        ]
    },
    "licenses-permits": {
        title: "Specialty Industry Licenses & Permits Audit",
        description: "Identify and apply for specialty state jurisdictional operating mandates.",
        prices: { starter: 99.00, compliance: 199.00, enterprise: 399.00 },
        extraFields: [
            { id: "industry_class", label: "Specific Industry Classification", type: "select", options: ["Transportation / Logistics / Hazmat", "Construction / Contracting", "Food Service / Hospitality", "Professional Consulting / Services"] },
            { id: "permits_states_list", label: "List All States Where Traveling / Conducting Trade", type: "text", placeholder: "e.g., IL, IN, WI, MI" }
        ]
    },
    "trucker-insurance": {
        title: "Commercial Trucker Liability Insurance Placement",
        description: "Initiate risk underwriting routing to secure commercial auto liability, motor truck cargo, and physical damage policy options that clear top broker asset thresholds.",
        prices: { starter: 149.00, compliance: 299.00, enterprise: 549.00 },
        extraFields: [
            { id: "radius_miles", label: "Primary Operating Radius Parameters", type: "select", options: ["Interstate (Unlimited / 50-State OTR)", "Regional (Under 500 Mile Radius)", "Local (Under 100 Mile Radius Only)"] },
            { id: "prior_insurance", label: "Have you had commercial insurance in the past 3 years?", type: "select", options: ["No - Brand new venture startup profile", "Yes - Continuous coverage with no major lapses"] },
            { id: "target_liability_limit", label: "Requested Auto Liability Cover Limit", type: "select", options: ["$1,000,000 (Standard Broker Minimum Requirement)", "$750,000 (FMCSA Legal Minimum for Freight)", "$2,000,000+ Specialized Over-Sized Cargo limits"] },
            { id: "ins_cargo_limit_target", label: "Requested Motor Truck Cargo Policy Limit", type: "select", options: ["$100,000 (Standard Commercial Cargo Limit)", "$250,000 High-Value Commodity Protection", "$50,000 Hotshot Cargo Tier"] },
            { id: "ins_equipment_list", label: "List Equipment Details (Year, Make, Model, Value for All Rigs)", type: "textarea", placeholder: "e.g., 2021 Peterbilt 579 - Valued $90,000..." }
        ]
    },
    "broker-insurance": {
        title: "Freight Broker BMC-84 Bond & Risk Structuring",
        description: "Process applications for the mandatory $75,000 FMCSA financial security bond to activate freight broker operational compliance status codes.",
        prices: { starter: 129.00, compliance: 249.00, enterprise: 499.00 },
        extraFields: [
            { id: "credit_tier_est", label: "Self-Estimated Principal Credit Profile Tier", type: "select", options: ["Excellent (720+ FICO Profile)", "Good (660 - 719 FICO Profile)", "Fair / Rebuilding (Under 660 FICO Profile)"] },
            { id: "has_experience", label: "Principal Owner has active logistics/trucking experience?", type: "select", options: ["Yes - 2+ Years industry background experience", "No - Entry-level asset management profile"] },
            { id: "bi_fmcsa_mc_num", label: "Broker MC Number or Pending Docket Reference ID", type: "text", placeholder: "e.g., MC-123456" },
            { id: "bi_annual_revenue_est", label: "Estimated Annual Gross Freight Volume Shipped ($)", type: "text", placeholder: "e.g., $500,000" }
        ]
    },
    "new-entrant-audit": {
        title: "FMCSA New Entrant Safety Audit Preparation",
        description: "Review, organize, and catalog critical compliance logs alongside an expert auditor to satisfy mandatory safety audits within your initial 12-month window.",
        prices: { starter: 75.00, compliance: 199.00, enterprise: 349.00 },
        extraFields: [
            { id: "aud_usdot_reference", label: "USDOT Number Under Active Safety Review", type: "text", placeholder: "e.g., 1234567" },
            { id: "aud_eld_system", label: "Current Electronic Logging Device (ELD) Provider", type: "select", options: ["Motive ELD / KeepTruckin Setup", "Samsara Fleet Tracking Hub", "Garmin eLog / Manual Logging Records Log"] },
            { id: "aud_has_accident_history", label: "Has this entity logged any DOT-recordable accidents since launch?", type: "select", options: ["No accidents or safety record markings", "Yes - Recordable items present (Safety logs required)"] },
            { id: "aud_maintenance_records", label: "Are physical vehicle periodic inspections recorded and file-ready?", type: "select", options: ["Yes - Fully documentation compliant under Part 396", "No - We require custom vehicle inspection template forms"] }
        ]
    }
}; // 🏁 End of global window.WIZARD_REGISTRY configuration mapping matrix tree


/**
 * 🚀 AUTOMATED WIZARD ROUTING ENGINE
 * Maps service keys dynamically to clean website page URLs
 */
function navigateToServicePage(serviceKey, selectedTier) {
    // 1. Convert standard registry keys back to your exact filename slugs
    let pageSlug = serviceKey;

    // Direct mapping patches to match your exact structural filenames
    if (serviceKey === "employer-identification-number-ein") pageSlug = "employer-identification-number-ein";
    if (serviceKey === "dissolution") pageSlug = "dissolution";
    if (serviceKey === "doing-business-as-dba") pageSlug = "doing-business-as-dba";
    if (serviceKey === "process-agents-boc-3") pageSlug = "process-agents-boc-3";
    if (serviceKey === "international-fuel-tax-agreement-ifta") pageSlug = "international-fuel-tax-agreement-ifta";

    // 2. Build the exact destination address string with selected tier data attributes appended
    let destinationUrl = pageSlug + ".html";
    
    if (selectedTier) {
        destinationUrl += "?tier=" + encodeURIComponent(selectedTier);
    }

    // 3. Dispatch redirect instruction execution immediately
    console.log("Routing user natively to: " + destinationUrl);
    window.location.href = destinationUrl;
}

// Example usage hook for your dynamic buttons or purchase blocks:
// $(document).on('click', '.checkout-btn', function() {
//     let activeService = getCurrentServiceKey(); // e.g., "heavy-use-tax-2290"
//     let chosenTier = $(this).data('tier');       // e.g., "compliance"
//     navigateToServicePage(activeService, chosenTier);
// });
