// assets/js/wizard-recovery.js
(function initializeWizardStateRecovery() {
    "use strict";

    const WIZARD_STORAGE_KEY = "filings4u_wizard_draft_cache";
    const wizardForm = document.querySelector('form');

    // 1. AUTO-HYDRATE: Populate typed fields immediately upon page loading
    document.addEventListener("DOMContentLoaded", () => {
        const savedDraftString = localStorage.getItem(WIZARD_STORAGE_KEY);
        if (savedDraftString) {
            try {
                const savedDataModel = JSON.parse(savedDraftString);
                Object.keys(savedDataModel).forEach(inputFieldName => {
                    const matchedElement = document.getElementsByName(inputFieldName)[0] || document.getElementById(inputFieldName);
                    if (matchedElement) {
                        matchedElement.value = savedDataModel[inputFieldName];
                    }
                });
                console.log("✓ Wizard state recovered from local disk anchors successfully.");
            } catch (err) {
                console.error("Failed to parse cached wizard data vectors:", err);
            }
        }
    });

    // 2. LIVE TRACKING: Intercept user typing to update state cache dynamically
    if (wizardForm) {
        wizardForm.addEventListener('input', () => {
            const formDataContainer = new FormData(wizardForm);
            const serializedDataModel = {};
            
            formDataContainer.forEach((value, key) => {
                serializedDataModel[key] = value;
            });

            localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(serializedDataModel));
        });

        // 3. PURGE STATE: Wipe memory cache once the wizard is finally completed and submitted safely
        wizardForm.addEventListener('submit', () => {
            localStorage.removeItem(WIZARD_STORAGE_KEY);
        });
    }
})();
