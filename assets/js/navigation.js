/**
 * filings4u Management — Shared Navigation
 * One source of truth for management sidebar targets.
 */
(function () {
  "use strict";

  const groups = [
    {
      label: "Websites",
      items: [
        ["website", "▣", "Main Website", "admin-management.html#website"],
        ["client-portal", "◫", "Client Portal", "admin-management.html#client-portal"],
        ["admin-portal", "▦", "Admin Portal", "admin-management.html#admin-portal"],
        ["wizard", "◇", "Wizard", "admin-management.html#wizard"]
      ]
    },
    {
      label: "Business",
      items: [
        ["customers", "◎", "Customers", "admin-customers.html"],
        ["orders", "▤", "Orders", "admin-orders.html"],
        ["applications", "▧", "Applications", "admin-applications.html"],
        ["invoices", "$", "Invoices & Payments", "admin-invoices.html"],
        ["support", "◌", "Support", "admin-support.html"],
        ["compliance", "✓", "Compliance", "admin-compliance.html"],
        ["design", "✦", "Design Projects", "admin-design.html"]
      ]
    },
    {
      label: "Content",
      items: [
        ["pages", "▤", "Pages", "admin-pages.html"],
        ["services", "◈", "Services", "admin-services.html"],
        ["blog", "¶", "Blog", "admin-blog.html"],
        ["faqs", "?", "FAQs", "admin-faqs.html"],
        ["knowledge", "▧", "Knowledge Base", "admin-knowledge.html"],
        ["media", "▣", "Media", "admin-media.html"]
      ]
    },
    {
      label: "Operations",
      items: [
        ["tasks", "✓", "Tasks", "admin-management.html#tasks"],
        ["calendar", "□", "Calendar", "admin-management.html#calendar"],
        ["notifications", "○", "Notifications", "admin-management.html#notifications"],
        ["activity", "↻", "Activity", "admin-management.html#activity"]
      ]
    },
    {
      label: "Platform",
      items: [
        ["users", "◎", "Users & Roles", "admin-management.html#users"],
        ["automations", "◇", "Automations", "admin-management.html#automations"],
        ["integrations", "⌁", "Integrations", "admin-management.html#integrations"],
        ["security", "⌾", "Security", "admin-management.html#security"],
        ["logs", "▤", "System Logs", "admin-management.html#logs"],
        ["settings", "⚙", "Settings", "admin-management.html#settings"]
      ]
    }
  ];

  function currentKey() {
    const body = document.body;
    if (body && body.dataset.managementPage) return body.dataset.managementPage;
    const file = (location.pathname.split("/").pop() || "").toLowerCase();
    const map = {
      "admin-customers.html":"customers","admin-orders.html":"orders",
      "admin-applications.html":"applications","admin-invoices.html":"invoices",
      "admin-support.html":"support","admin-compliance.html":"compliance",
      "admin-design.html":"design","admin-pages.html":"pages",
      "admin-services.html":"services","admin-blog.html":"blog",
      "admin-faqs.html":"faqs","admin-knowledge.html":"knowledge",
      "admin-media.html":"media"
    };
    if (map[file]) return map[file];
    return (location.hash || "#home").slice(1);
  }

  function itemMarkup(item, active) {
    const [key, icon, label, href] = item;
    return `<a${key === active ? ' class="is-active"' : ""} href="${href}" data-management-target="${key}"><span>${icon}</span>${label}</a>`;
  }

  function render() {
    const host = document.querySelector("[data-management-navigation]") ||
                 document.getElementById("managementNavigation");
    if (!host) return;

    const active = currentKey();
    host.innerHTML =
      `<a class="management-nav__home${active === "home" ? " is-active" : ""}" href="admin-management.html#home"><span>⌂</span>Home</a>` +
      groups.map(group => `
        <section class="management-nav-group is-open">
          <button class="management-nav-group__toggle" type="button" aria-expanded="true">
            <span>${group.label}</span><b>⌄</b>
          </button>
          <div class="management-nav-group__panel">
            ${group.items.map(item => itemMarkup(item, active)).join("")}
          </div>
        </section>`).join("");

    host.querySelectorAll(".management-nav-group__toggle").forEach(button => {
      button.addEventListener("click", () => {
        const group = button.closest(".management-nav-group");
        const panel = group.querySelector(".management-nav-group__panel");
        const open = !group.classList.contains("is-open");
        group.classList.toggle("is-open", open);
        if (panel) panel.hidden = !open;
        button.setAttribute("aria-expanded", String(open));
      });
    });
  }

  window.filings4uManagementNavigation = { groups, render, currentKey };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render, { once: true });
  } else {
    render();
  }
})();
