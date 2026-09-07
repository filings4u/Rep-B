/** filings4u unified runtime shell — visual only, no business logic changes. */
(function(){
  'use strict';
  function applyRuntimeShell(){
    document.documentElement.classList.add('f4u-shell-ready');
    const style=document.createElement('style');
    style.id='filings4u-runtime-shell-overrides';
    style.textContent=`
      #f4uSidebarCollapseToggleHandle{background:#fff!important;color:#475569!important;border:1px solid #e2e8f0!important;border-radius:10px!important}
      #f4uSidebarCollapseToggleHandle:hover{background:#f4fbf8!important;color:#0e9f6e!important;border-color:#bdebdc!important}
      #f4uSidebarFloatingRestoreWidget{background:#10b981!important;color:#fff!important;box-shadow:0 12px 28px rgba(16,185,129,.28)!important}
      #f4uSidebarFloatingRestoreWidget:hover{background:#0e9f6e!important}
      #f4uBrandedMobileNavToggleBar{background:rgba(255,255,255,.97)!important;border-bottom:1px solid #e2e8f0!important}
      #f4uMobileDropdownContainerTray{background:#fff!important;border:1px solid #e2e8f0!important;border-radius:18px!important;box-shadow:0 20px 55px rgba(10,31,68,.14)!important}
      .portal-sidebar{background:#fff!important;border-right:1px solid #e2e8f0!important}
      .portal-main{background:transparent!important}
    `;
    document.head.appendChild(style);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyRuntimeShell);
  else applyRuntimeShell();
})();
