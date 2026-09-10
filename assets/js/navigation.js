/**
 * filings4u Management — Shared Navigation
 * One source of truth for every management page.
 *
 * Required target on every management HTML page:
 * <nav class="management-nav" id="managementNavigation" data-management-navigation></nav>
 */
(function () {
  "use strict";

  const groups = [
    {
      key: "websites",
      label: "Websites",
      items: [
        ["website", "▣", "Main Website", "admin-management.html#website"],
        ["client-portal", "◫", "Client Portal", "admin-management.html#client-portal"],
        ["admin-portal", "▦", "Admin Portal", "admin-management.html#admin-portal"],
        ["wizard", "◇", "Wizard", "admin-management.html#wizard"]
      ]
    },
    {
      key: "business",
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
      key: "content",
      label: "Content",
      items: [
        ["pages", "▤", "Pages", "admin-pages.html"],
        ["services", "◈", "Services", "admin-services.html"],
        ["blog", "¶", "Blog", "admin-blog.html"],
        ["faqs", "?", "FAQs", "admin-faqs.html"],
        ["knowledge", "▧", "Knowledge Center", "admin-knowledge.html"],
        ["media", "▣", "Media", "admin-media.html"]
      ]
    },
    {
      key: "operations",
      label: "Operations",
      items: [
        ["tasks", "✓", "Tasks", "admin-tasks.html"],
        ["calendar", "□", "Calendar", "admin-management.html#calendar"],
        ["notifications", "○", "Notifications", "admin-management.html#notifications"],
        ["activity", "↻", "Activity", "admin-management.html#activity"]
      ]
    },
    {
      key: "platform",
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

  const fileToKey = {
    "admin-customers.html": "customers",
    "admin-orders.html": "orders",
    "admin-applications.html": "applications",
    "admin-invoices.html": "invoices",
    "admin-support.html": "support",
    "admin-compliance.html": "compliance",
    "admin-design.html": "design",
    "admin-pages.html": "pages",
    "admin-services.html": "services",
    "admin-blog.html": "blog",
    "admin-faqs.html": "faqs",
    "admin-knowledge.html": "knowledge",
    "admin-media.html": "media",
    "admin-tasks.html": "tasks"
  };

  function currentKey() {
    const bodyKey = document.body?.dataset?.managementPage;
    if (bodyKey) return bodyKey;

    const file = (location.pathname.split("/").pop() || "").toLowerCase();
    if (fileToKey[file]) return fileToKey[file];

    return (location.hash || "#home").replace(/^#/, "").split("?")[0] || "home";
  }

  function currentGroup(activeKey) {
    return groups.find(group => group.items.some(item => item[0] === activeKey))?.key || "";
  }

  function itemMarkup(item, activeKey) {
    const [key, icon, label, href] = item;
    return `
      <a href="${href}"
         data-management-target="${key}"
         ${key === activeKey ? 'class="is-active" aria-current="page"' : ""}>
        <span aria-hidden="true">${icon}</span>
        ${label}
      </a>`;
  }

  function groupMarkup(group, activeKey, activeGroup) {
    const storageKey = `filings4u-management-nav-${group.key}`;
    const saved = localStorage.getItem(storageKey);
    const isOpen = saved === null ? true : saved === "open";
    const forceOpen = group.key === activeGroup;
    const open = forceOpen || isOpen;

    return `
      <section class="management-nav-group ${open ? "is-open" : ""}"
               data-nav-group="${group.key}">
        <button class="management-nav-group__toggle"
                type="button"
                aria-expanded="${open}">
          <span>${group.label}</span>
          <b aria-hidden="true">⌄</b>
        </button>
        <div class="management-nav-group__panel" ${open ? "" : "hidden"}>
          ${group.items.map(item => itemMarkup(item, activeKey)).join("")}
        </div>
      </section>`;
  }

  function bindGroups(host) {
    host.querySelectorAll("[data-nav-group]").forEach(group => {
      const toggle = group.querySelector(".management-nav-group__toggle");
      const panel = group.querySelector(".management-nav-group__panel");
      if (!toggle || !panel) return;

      toggle.addEventListener("click", () => {
        const open = !group.classList.contains("is-open");
        group.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        panel.hidden = !open;
        localStorage.setItem(
          `filings4u-management-nav-${group.dataset.navGroup}`,
          open ? "open" : "closed"
        );
      });
    });
  }

  function render() {
    /*
     * Preferred shared target first.
     * Fallback to an existing .management-nav so older pages are not broken
     * while they are being converted to the shared target.
     */
    const host =
      document.querySelector("[data-management-navigation]") ||
      document.getElementById("managementNavigation") ||
      document.querySelector(".management-nav");

    if (!host) {
      console.error(
        "filings4u Management navigation target missing. Add: " +
        '<nav class="management-nav" id="managementNavigation" data-management-navigation></nav>'
      );
      return;
    }

    host.classList.add("management-nav");
    host.id = "managementNavigation";
    host.setAttribute("data-management-navigation", "");

    const activeKey = currentKey();
    const activeGroup = currentGroup(activeKey);

    host.innerHTML = `
      <a class="management-nav__home ${activeKey === "home" ? "is-active" : ""}"
         href="admin-management.html#home"
         ${activeKey === "home" ? 'aria-current="page"' : ""}>
        <span aria-hidden="true">⌂</span>
        Home
      </a>
      ${groups.map(group => groupMarkup(group, activeKey, activeGroup)).join("")}
    `;

    bindGroups(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }

  window.addEventListener("hashchange", render);

  window.filings4uManagementNavigation = {
    render,
    groups
  };
})();