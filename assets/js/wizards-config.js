// assets/js/wizards-config.js
const WIZARD_REGISTRY = {
    "2290": {
        title: "Form 2290 Heavy Vehicle Use Tax Filing",
        basePrice: 49.00, govFee: 0.00,
        faqs: [
            { q: "What is Form 2290?", a: "An annual Federal Excise Tax on heavy highway vehicles weighing 55,000 lbs or more." },
            { q: "When is the deadline?", a: "August 31st for vehicles used first in July." }
        ],
        steps: [
            {
                title: "Business Details", description: "Provide your EIN and registered commercial enterprise metadata.",
                fields: [
                    { type: "text", name: "business_name", label: "Legal Business Name", required: true, placeholder: "As registered with the IRS" },
                    { type: "text", name: "ein", label: "Employer Identification Number (EIN)", required: true, placeholder: "00-0000000" }
                ]
            },
            {
                title: "Vehicle Parameters", description: "Input your heavy vehicle specifications.",
                fields: [
                    { type: "text", name: "vin", label: "Vehicle Identification Number (VIN)", required: true, placeholder: "17-digit VIN" },
                    { type: "select", name: "weight_category", label: "Gross Taxable Weight Category", required: true, options: [
                        { value: "V", label: "Category V: 55,000 - 75,000 lbs" },
                        { value: "W", label: "Category W: Over 75,000 lbs" }
                    ]}
                ]
            }
        ]
    },
    "llc-formation": {
        title: "Corporate LLC Formation Registry",
        basePrice: 199.00, govFee: 150.00,
        faqs: [
            { q: "What is included?", a: "Articles of Organization filing, name availability check, and processing tracking." }
        ],
        steps: [
            {
                title: "Entity Identification", description: "Establish the public naming criteria and jurisdiction.",
                fields: [
                    { type: "text", name: "desired_llc_name", label: "Proposed LLC Company Name", required: true, placeholder: "e.g., Titan Logistics LLC" },
                    { type: "select", name: "filing_state", label: "Formation State Jurisdiction", required: true, options: [
                        { value: "DE", label: "Delaware" }, { value: "WY", label: "Wyoming" }, { value: "TX", label: "Texas" }
                    ]}
                ]
            },
            {
                title: "Management Structure", description: "Define who will manage operational activities.",
                fields: [
                    { type: "select", name: "llc_management", label: "Management Type", required: true, options: [
                        { value: "member", label: "Member Managed (Run by Owners)" },
                        { value: "manager", label: "Manager Managed (Appointed Officers)" }
                    ]}
                ]
            }
        ]
    },
    "dot-consortium": {
        title: "DOT Drug & Alcohol Consortium Enrollment",
        basePrice: 149.00, govFee: 0.00,
        faqs: [{ q: "Who needs this?", a: "All CDL drivers operating commercial motor vehicles (CMVs) must be in a random testing pool." }],
        steps: [{
            title: "Driver Testing Pool Setup", description: "Enroll company compliance contacts and expected active drivers.",
            fields: [
                { type: "text", name: "dot_number", label: "USDOT Number", required: true, placeholder: "Enter 7-8 digit number" },
                { type: "number", name: "driver_count", label: "Number of Active Drivers", required: true, placeholder: "e.g., 2" },
                { type: "text", name: "der_name", label: "Designated Employer Representative (DER)", required: true, placeholder: "Full Compliance Contact Name" }
            ]
        }]
    },
    "ein": {
        title: "Employer Identification Number (EIN) Application",
        basePrice: 79.00, govFee: 0.00,
        faqs: [{ q: "What is an EIN?", a: "A federal tax ID issued by the IRS for business identification, payroll, and banking." }],
        steps: [{
            title: "Tax ID Request Data", description: "Submit personal or principal manager identification metrics.",
            fields: [
                { type: "text", name: "responsible_party_name", label: "Responsible Party Legal Name", required: true, placeholder: "First & Last Name" },
                { type: "text", name: "ssn_itin", label: "Social Security Number or ITIN", required: true, placeholder: "000-00-0000" },
                { type: "select", name: "entity_type", label: "Structure Type", required: true, options: [
                    { value: "sole_prop", label: "Sole Proprietorship" }, { value: "llc", label: "Limited Liability Company" }, { value: "corp", label: "Corporation" }
                ]}
            ]
        }]
    },
    "new-entrant": {
        title: "FMCSA New Entrant Safety Assurance Program",
        basePrice: 249.00, govFee: 0.00,
        faqs: [{ q: "What is the Safety Audit?", a: "A mandatory evaluation within the first 12 months of standard interstate operations." }],
        steps: [{
            title: "Safety Program Intake", description: "Declare the metrics required for background verification evaluation.",
            fields: [
                { type: "text", name: "usdot_num", label: "USDOT Number", required: true },
                { type: "text", name: "safety_contact", label: "Safety Director Contact Name", required: true },
                { type: "select", name: "safety_software", label: "Logistical ELD / Safety Software Used", required: true, options: [
                    { value: "samsara", label: "Samsara Fleet Monitoring" }, { value: "motive", label: "Motive (KeepTruckin)" }, { value: "other", label: "Other / Manual Logs" }
                ]}
            ]
        }]
    },
    "nonprofit": {
        title: "501(c)(3) Nonprofit Incorporation",
        basePrice: 399.00, govFee: 275.00,
        faqs: [{ q: "What is a 501(c)(3)?", a: "Federal corporate tax-exempt status for religious, charitable, or educational groups." }],
        steps: [
            {
                title: "Exempt Intent Definition", description: "Establish the specific organizational mission guidelines.",
                fields: [
                    { type: "text", name: "organization_title", label: "Proposed Nonprofit Name", required: true },
                    { type: "select", name: "exempt_purpose", label: "Primary Charitable Category", required: true, options: [
                        { value: "charitable", label: "Charitable / Humanitarian Relief" },
                        { value: "religious", label: "Religious Organization" },
                        { value: "educational", label: "Educational Foundations" }
                    ]},
                    { type: "text", name: "mission_statement", label: "Brief Mission Scope", required: true, placeholder: "Describe purpose in 1 sentence" }
                ]
            },
            {
                title: "Board of Directors Matrix", description: "Provide details for at least 3 initial board members.",
                fields: [
                    { type: "text", name: "director_1", label: "President / Director 1 Name", required: true },
                    { type: "text", name: "director_2", label: "Secretary / Director 2 Name", required: true },
                    { type: "text", name: "director_3", label: "Treasurer / Director 3 Name", required: true }
                ]
            }
        ]
    },
    "registered-agent": {
        title: "Registered Agent Representation Service",
        basePrice: 99.00, govFee: 0.00,
        faqs: [{ q: "What does an agent do?", a: "Accepts official state correspondence, legal notices, and service of process documents on your behalf." }],
        steps: [{
            title: "Representation Scope", description: "Select the specific region requiring local statutory physical presence.",
            fields: [
                { type: "select", name: "agent_state", label: "Jurisdiction Needing Coverage", required: true, options: [
                    { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "WI", label: "Wisconsin" }
                ]},
                { type: "text", name: "current_entity_name", label: "Registered Entity Legal Title", required: true }
            ]
        }]
    },
    "trucker-authority": {
        title: "Interstate Trucker Operating Authority (MC Number)",
        basePrice: 499.00, govFee: 300.00,
        faqs: [{ q: "What is an MC number?", a: "The regulatory identifier allowing commercial transport for-hire across state borders." }],
        steps: [
            {
                title: "Authority Classification", description: "Choose what structural parameters you plan to execute.",
                fields: [
                    { type: "text", name: "legal_name", label: "Legal Business Name", required: true },
                    { type: "select", name: "authority_type", label: "Operating Authority Category", required: true, options: [
                        { value: "common", label: "Motor Common Carrier of Property" },
                        { value: "contract", label: "Motor Contract Carrier of Property" },
                        { value: "broker", label: "Property Broker Logistics Hub" }
                    ]}
                ]
            },
            {
                title: "Equipment Cargo Profiles", description: "Designate the operational scope of your physical fleet vehicles.",
                fields: [
                    { type: "select", name: "cargo_type", label: "Primary Commodity Profile", required: true, options: [
                        { value: "general", label: "General Dry Van Freight Logistics" },
                        { value: "reefer", label: "Refrigerated Perishables Distribution" },
                        { value: "hazmat", label: "Hazardous Class Materials Transport" }
                    ]}
                ]
            }
        ]
    },
    "corporations": {
        title: "Standard Corporate Incorporation (C-Corp / S-Corp)",
        basePrice: 249.00, govFee: 125.00,
        faqs: [{ q: "What is the difference?", a: "C-Corps feature double taxation; S-Corps pass tax liabilities directly to owners." }],
        steps: [{
            title: "Share Capital Configuration", description: "Establish corporate stock configurations and parameters.",
            fields: [
                { type: "text", name: "corp_name", label: "Proposed Corporation Title", required: true },
                { type: "number", name: "total_shares", label: "Total Authorized Stock Shares", required: true, placeholder: "e.g., 10000" },
                { type: "select", name: "tax_election", label: "Federal Subchapter Tax Election", required: true, options: [
                    { value: "c_corp", label: "Standard C-Corporation Framework" },
                    { value: "s_corp", label: "Subchapter S-Corporation Pass-Through" }
                ]}
            ]
        }]
    },
    "dba-registration": {
        title: "Fictitious Name / DBA Registration",
        basePrice: 89.00, govFee: 50.00,
        faqs: [{ q: "What is a DBA?", a: "Doing Business As registry allows a company to trade cleanly under an alternate brand title." }],
        steps: [{
            title: "Assumed Brand Mapping", description: "Define target alternative trade identities.",
            fields: [
                { type: "text", name: "parent_company", label: "Parent Entity or Owner Legal Name", required: true },
                { type: "text", name: "desired_dba", label: "Requested Assumed Trade Name (DBA)", required: true, placeholder: "e.g., Express Delivery Solutions" }
            ]
        }]
    },
    "sole-proprietorship": {
        title: "Sole Proprietorship Enterprise Registry",
        basePrice: 69.00, govFee: 25.00,
        faqs: [{ q: "Is this separate?", a: "No, a sole proprietorship binds asset debts and tax obligations directly to your individual persona." }],
        steps: [{
            title: "Owner Identity Profile", description: "Register localized individual business infrastructure attributes.",
            fields: [
                { type: "text", name: "owner_full_name", label: "Proprietor Legal Name", required: true },
                { type: "text", name: "trade_street_address", label: "Business Physical Address", required: true }
            ]
        }]
    },
    "annual-reports": {
        title: "Corporate Mandatory State Annual Report Filing",
        basePrice: 79.00, govFee: 100.00,
        faqs: [{ q: "Why file annually?", a: "Failing to submit timely reports results in immediate state entity dissolution protocols." }],
        steps: [{
            title: "Compliance Verification Data", description: "Input identifying file values to extract current state parameters.",
            fields: [
                { type: "text", name: "state_file_id", label: "State Entity Charter/File Number", required: true },
                { type: "select", name: "reporting_year", label: "Target Compliance Filing Year", required: true, options: [
                    { value: "2026", label: "Current 2026 Reporting Cycle" }, { value: "2025", label: "Delinquent 2025 Filing Period" }
                ]}
            ]
        }]
    },
    "business-licenses": {
        title: "Local Municipal Business License Application",
        basePrice: 129.00, govFee: 75.00,
        faqs: [{ q: "Who needs this?", a: "Any company operating a physical commercial office or storefront workspace." }],
        steps: [{
            title: "Localized Zoning Classification", description: "Identify physical jurisdiction attributes.",
            fields: [
                { type: "text", name: "city_county", label: "City or County Municipality", required: true },
                { type: "number", name: "facility_sqft", label: "Estimated Commercial Footprint (Sq Ft)", required: true }
            ]
        }]
    },
    "employer-identification-number": {
        title: "Corporate EIN Registration Hub",
        basePrice: 79.00, govFee: 0.00,
        faqs: [{ q: "Is this an EIN?", a: "Yes, this configuration offers a secondary direct tracking tunnel alias." }],
        steps: [{
            title: "Tax Registration Matrix", description: "Enter organizational structural attributes.",
            fields: [
                { type: "text", name: "legal_name_ein", label: "Legal Entity Designation Name", required: true },
                { type: "text", name: "ssn_principal", label: "Principal Officer Social Security Number", required: true }
            ]
        }]
    },
    "operating-agreement": {
        title: "Custom LLC Operating Agreement Draftsman",
        basePrice: 99.00, govFee: 0.00,
        faqs: [{ q: "Is this filed?", a: "No, this is an internal governance document that protects your limited liability status." }],
        steps: [{
            title: "Equity Allocation Variables", description: "Design internal operating governance configurations.",
            fields: [
                { type: "text", name: "llc_title_ref", label: "LLC Corporate Reference Name", required: true },
                { type: "number", name: "owner_1_percent", label: "Principal Member 1 Equity Percentage", required: true, placeholder: "e.g., 100" }
            ]
        }]
    },
    "entity-dissolution": {
        title: "Articles of Entity Dissolution Filing",
        basePrice: 189.00, govFee: 50.00,
        faqs: [{ q: "What does this do?", a: "Formally closes the corporate entity to stop accumulating annual state tax obligations." }],
        steps: [{
            title: "Winding Down Protocol Data", description: "Capture registration metrics to execute termination actions.",
            fields: [
                { type: "text", name: "terminate_name", label: "Exact Corporate Registered Name", required: true },
                { type: "date", name: "cease_date", label: "Effective Date of Operations Cessation", required: true }
            ]
        }]
    },
    "heavy-use-tax": {
        title: "IRS Heavy Vehicle Excise Tax (HVUT) processing",
        basePrice: 49.00, govFee: 0.00,
        faqs: [{ q: "Is this Form 2290?", a: "Yes, this handles alternative asset scheduling profiles." }],
        steps: [{
            title: "Excise Tax Structuring", description: "Provide entity identification attributes.",
            fields: [
                { type: "text", name: "ein_heavy", label: "Employer Identification Number (EIN)", required: true },
                { type: "number", name: "taxable_fleet_count", label: "Total Taxable Heavy Vehicles", required: true }
            ]
        }]
    },
    "federal-income-tax": {
        title: "Corporate Federal Income Tax Filing (Form 1120/1120S)",
        basePrice: 499.00, govFee: 0.00,
        faqs: [{ q: "When is this due?", a: "Typically March 15th for S-Corps and April 15th for C-Corps." }],
        steps: [
            {
                title: "Gross Receipts Data Matrix", description: "Input baseline annual organizational revenue totals.",
                fields: [
                    { type: "number", name: "gross_receipts", label: "Annual Gross Receipts / Revenue", required: true },
                    { type: "number", name: "cost_of_goods", label: "Cost of Goods Sold (COGS)", required: true }
                ]
            },
            {
                title: "Deduction Asset Profiles", description: "Itemize corporate operations operational expenditures.",
                fields: [
                    { type: "number", name: "salaries_paid", label: "Total Officer Compensation & Salaries", required: true },
                    { type: "number", name: "rent_utilities", label: "Total Facility Rent & Operational Utilities", required: true }
                ]
            }
        ]
    },
    "state-income-tax": {
        title: "State Corporate Franchise & Income Tax Filing",
        basePrice: 299.00, govFee: 25.00,
        faqs: [{ q: "Do I owe state tax?", a: "Most states impose a minimum franchise fee or income tax to maintain active corporate standings." }],
        steps: [{
            title: "Apportionment Metrics Factor", description: "Define localized physical asset allocations.",
            fields: [
                { type: "select", name: "state_tax_jurisdiction", label: "Filing State Profile", required: true, options: [
                    { value: "CA", label: "California Franchise Tax Board" }, { value: "NY", label: "New York Dept of Taxation" }
                ]},
                { type: "number", name: "state_revenue", label: "Revenue Allocated to This State", required: true }
            ]
        }]
    },
    "sales-tax-registration": {
        title: "State Sales Tax Certificate / Reseller Permit",
        basePrice: 119.00, govFee: 0.00,
        faqs: [{ q: "What is a resale certificate?", a: "Allows you to purchase inventory tax-free when intended strictly for resale operations." }],
        steps: [{
            title: "Nexus Structuring Data", description: "Establish state transactional exposure thresholds.",
            fields: [
                { type: "text", name: "product_category", label: "Primary Retail Product Classification", required: true },
                { type: "select", name: "nexus_type", label: "Nexus Operational Trigger Type", required: true, options: [
                    { value: "physical", label: "Physical Office/Warehouse Operations" },
                    { value: "economic", label: "Economic Remote Sales Threshold" }
                ]}
            ]
        }]
    },
    "payroll-tax": {
        title: "Employer Payroll Tax Account Setup",
        basePrice: 149.00, govFee: 0.00,
        faqs: [{ q: "When is this needed?", a: "Before you hire your first employee or pay an officer salary." }],
        steps: [{
            title: "Withholding Matrix Data", description: "Configure state unemployment registry interfaces.",
            fields: [
                { type: "date", name: "first_payroll_date", label: "Expected First Distribution Date", required: true },
                { type: "number", name: "estimated_w2_count", label: "Expected Total W-2 Employees", required: true }
            ]
        }]
    },
    "franchise-tax-filing": {
        title: "Annual Franchise Tax Filing Portal",
        basePrice: 99.00, govFee: 150.00,
        faqs: [{ q: "What is franchise tax?", a: "A fee paid to a state for the privilege of doing business there, regardless of profit." }],
        steps: [{
            title: "Capital Metric Assessment", description: "Provide corporate asset values.",
            fields: [
                { type: "text", name: "franchise_file_num", label: "State Corporate Entity Control ID", required: true },
                { type: "number", name: "gross_assets", label: "Total Worldwide Corporate Assets", required: true }
            ]
        }]
    },
    "owner-operators": {
        title: "Owner-Operator Trucker Lease Compliance Setup",
        basePrice: 179.00, govFee: 0.00,
        faqs: [{ q: "What is lease compliance?", a: "Ensures owner-operator agreements match truth-in-leasing rules under 49 CFR Part 376." }],
        steps: [{
            title: "Carrier Lease Alignment", description: "Submit leasing carrier identification fields.",
            fields: [
                { type: "text", name: "lessee_carrier_name", label: "Authorized Carrier Entity Name", required: true },
                { type: "text", name: "lessee_dot", label: "Carrier USDOT Number", required: true }
            ]
        }]
    },
    "driver-qualification-file": {
        title: "Driver Qualification (DQ) File Compliance Manager",
        basePrice: 89.00, govFee: 0.00,
        faqs: [{ q: "Who needs a DQ file?", a: "Every driver operating a commercial vehicle over 10,001 lbs must maintain a documented file." }],
        steps: [
            {
                title: "Driver Credentials Data", description: "Input operator credential metadata records.",
                fields: [
                    { type: "text", name: "driver_legal_name", label: "Operator Full Legal Name", required: true },
                    { type: "text", name: "cdl_license_number", label: "Commercial Driver License (CDL) #", required: true },
                    { type: "select", name: "cdl_class", label: "License Classification Tier", required: true, options: [
                        { value: "class_a", label: "Class A Commercial License" }, { value: "class_b", label: "Class B Commercial License" }
                    ]}
                ]
            },
            {
                title: "Medical Registry Records", description: "Link state medical card validation metrics.",
                fields: [
                    { type: "text", name: "med_card_num", label: "National Registry Medical Certificate #", required: true },
                    { type: "date", name: "med_expiration", label: "Medical Examiner Card Expiration Date", required: true }
                ]
            }
        ]
    },
    "ucr-registration": {
        title: "Unified Carrier Registration (UCR) Filing",
        basePrice: 69.00, govFee: 41.00,
        faqs: [{ q: "What is UCR?", a: "An annual registration fee based entirely on your total interstate commercial fleet count." }],
        steps: [{
            title: "Fleet Bracket Calculation", description: "Designate total commercial vehicle assets crossing state lines.",
            fields: [
                { type: "text", name: "ucr_dot_number", label: "Active USDOT Number", required: true },
                { type: "select", name: "fleet_bracket", label: "Total Commercial Fleet Vehicle Bracket", required: true, options: [
                    { value: "b1", label: "0 - 2 Commercial Vehicles ($41 Gov Fee)" },
                    { value: "b2", label: "3 - 5 Commercial Vehicles ($121 Gov Fee)" },
                    { value: "b3", label: "6 - 20 Commercial Vehicles ($242 Gov Fee)" }
                ]}
            ]
        }]
    },
    "process-agents": {
        title: "BOC-3 Process Agent Filing Automation",
        basePrice: 50.00, govFee: 0.00,
        faqs: [{ q: "What is a BOC-3?", a: "Designates legal process agents in every state where your vehicles operate." }],
        steps: [{
            title: "Designation Processing", description: "Link process agent designations to your target operating authority.",
            fields: [
                { type: "text", name: "boc3_legal_title", label: "Authority Enterprise Registered Title", required: true },
                { type: "text", name: "fmcsa_mc_number", label: "FMCSA MC / MX Operating Number", required: true }
            ]
        }]
    },
    "ifta-registration": {
        title: "International Fuel Tax Agreement (IFTA) License Setup",
        basePrice: 159.00, govFee: 15.00,
        faqs: [{ q: "What is IFTA?", a: "Simplifies fuel use tax reporting for carriers operating across multiple states or provinces." }],
        steps: [{
            title: "Base Jurisdiction Intake", description: "Define your fleet home operational tracking base.",
            fields: [
                { type: "text", name: "ifta_dot", label: "USDOT Compliance ID Number", required: true },
                { type: "select", name: "base_jurisdiction", label: "Base IFTA Licensing State", required: true, options: [
                    { value: "IL", label: "Illinois Dept of Revenue" }, { value: "TX", label: "Texas Comptroller Hub" }
                ]}
            ]
        }]
    },
    "licenses-permits": {
        title: "State Intrastate Highway Hauling Permits",
        basePrice: 129.00, govFee: 50.00,
        faqs: [{ q: "Which states need specific permits?", a: "NY (HUT), KY (KYU), NM (Weight-Distance), and OR have independent mileage-tax permits." }],
        steps: [{
            title: "Permit Framework Scope", description: "Select regional weight-distance programmatic overlays.",
            fields: [
                { type: "checkbox", name: "permit_ny", label: "New York Highway Use Tax (HUT) Sticker" },
                { type: "checkbox", name: "permit_ky", label: "Kentucky KYU Intrastate Tax Account" },
                { type: "checkbox", name: "permit_nm", label: "New Mexico Weight-Distance Permit" }
            ]
        }]
    },
    "trucker-insurance": {
        title: "Commercial Trucker Fleet Liability Insurance Underwriting",
        basePrice: 249.00, govFee: 0.00,
        faqs: [{ q: "What are the legal minimums?", a: "Freight requires $750,000 in primary auto liability; hazmat requires up to $5,000,000." }],
        steps: [
            {
                title: "Fleet Risk Evaluation", description: "Establish underwriting metrics for policy generation pipelines.",
                fields: [
                    { type: "select", name: "liability_limit", label: "Requested Primary Auto Liability Limit", required: true, options: [
                        { value: "750k", label: "$750,000 Minimum Legal Limit" },
                        { value: "1m", label: "$1,000,000 Freight Standard Tier" },
                        { value: "5m", label: "$5,000,000 Hazmat Fleet Profile" }
                    ]},
                    { type: "number", name: "scheduled_autos", label: "Total Power Units To Insure (Tractors)", required: true }
                ]
            },
            {
                title: "Cargo Exposure Matrix", description: "Define cargo exposure variables.",
                fields: [
                    { type: "text", name: "cargo_limit_val", label: "Inland Cargo Insurance Limit Requested", required: true, placeholder: "e.g., $100,000" },
                    { type: "number", name: "claims_history_5yr", label: "Total Reportable Accidents / Claims (Last 5 Yrs)", required: true, placeholder: "0 if clean" }
                ]
            }
        ]
    },
    "broker-insurance": {
        title: "Freight Broker BMC-84 Surety Bond Application",
        basePrice: 199.00, govFee: 0.00,
        faqs: [{ q: "What bond is required?", a: "FMCSA requires property brokers to carry a $75,000 surety bond (BMC-84) or trust (BMC-85)." }],
        steps: [{
            title: "Surety Underwriting Profile", description: "Provide financial profiling indicators for premium pricing generation.",
            fields: [
                { type: "text", name: "broker_mc_num", label: "Broker MC Number Reference", required: true },
                { type: "select", name: "credit_score_tier", label: "Estimated Personal Credit Rating Bracket", required: true, options: [
                    { value: "excellent", label: "Tier 1 Prime: Over 720 FICO" },
                    { value: "average", label: "Tier 2 Standard: 620 - 719 FICO" },
                    { value: "subprime", label: "Tier 3 Structured: Under 610 FICO" }
                ]}
            ]
        }]
    }
};

// Auto-duplicate identical mapping targets requested explicitly in the registry listing layout
WIZARD_REGISTRY["wizard-2290"] = WIZARD_REGISTRY["2290"];
WIZARD_REGISTRY["wizard-llc-formation"] = WIZARD_REGISTRY["llc-formation"];
WIZARD_REGISTRY["wizard-dot-consortium"] = WIZARD_REGISTRY["dot-consortium"];
WIZARD_REGISTRY["wizard-ein"] = WIZARD_REGISTRY["ein"];
WIZARD_REGISTRY["wizard-new-entrant"] = WIZARD_REGISTRY["new-entrant"];
WIZARD_REGISTRY["wizard-nonprofit"] = WIZARD_REGISTRY["nonprofit"];
WIZARD_REGISTRY["wizard-registered-agent"] = WIZARD_REGISTRY["registered-agent"];
WIZARD_REGISTRY["wizard-trucker-authority"] = WIZARD_REGISTRY["trucker-authority"];
WIZARD_REGISTRY["wizard-corporations"] = WIZARD_REGISTRY["corporations"];
WIZARD_REGISTRY["wizard-dba-registration"] = WIZARD_REGISTRY["dba-registration"];
WIZARD_REGISTRY["wizard-sole-proprietorship"] = WIZARD_REGISTRY["sole-proprietorship"];
WIZARD_REGISTRY["wizard-annual-reports"] = WIZARD_REGISTRY["annual-reports"];
WIZARD_REGISTRY["wizard-business-licenses"] = WIZARD_REGISTRY["business-licenses"];
WIZARD_REGISTRY["wizard-employer-identification-number"] = WIZARD_REGISTRY["employer-identification-number"];
WIZARD_REGISTRY["wizard-operating-agreement"] = WIZARD_REGISTRY["operating-agreement"];
WIZARD_REGISTRY["wizard-entity-dissolution"] = WIZARD_REGISTRY["entity-dissolution"];
WIZARD_REGISTRY["wizard-heavy-use-tax"] = WIZARD_REGISTRY["heavy-use-tax"];
WIZARD_REGISTRY["wizard-federal-income-tax"] = WIZARD_REGISTRY["federal-income-tax"];
WIZARD_REGISTRY["wizard-state-income-tax"] = WIZARD_REGISTRY["state-income-tax"];
WIZARD_REGISTRY["wizard-sales-tax-registration"] = WIZARD_REGISTRY["sales-tax-registration"];
WIZARD_REGISTRY["wizard-payroll-tax"] = WIZARD_REGISTRY["payroll-tax"];
WIZARD_REGISTRY["wizard-franchise-tax-filing"] = WIZARD_REGISTRY["franchise-tax-filing"];
WIZARD_REGISTRY["wizard-owner-operators"] = WIZARD_REGISTRY["owner-operators"];
WIZARD_REGISTRY["wizard-driver-qualification-file"] = WIZARD_REGISTRY["driver-qualification-file"];
WIZARD_REGISTRY["wizard-ucr-registration"] = W
