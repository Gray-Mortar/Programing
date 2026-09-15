(function () {
  "use strict";

  const capacitor = window.Capacitor;
  if (!capacitor || capacitor.getPlatform?.() !== "android") return;

  const app = capacitor.Plugins?.App;
  if (!app?.addListener) return;

  const exitWindowMs = 2200;
  const navigationStackKey = "ml_app_navigation_stack";
  const returningToKey = "ml_app_navigation_returning_to";
  let lastExitRequest = 0;
  let exitHint = null;
  let exitHintTimer = 0;

  function currentLocation() {
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }

  function isAppRoot(location = currentLocation()) {
    const path = location.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
    return (
      path === "/" ||
      path === "/index.html" ||
      path === "/cover/welcome.html"
    );
  }

  function readNavigationStack() {
    try {
      const stack = JSON.parse(sessionStorage.getItem(navigationStackKey));
      return Array.isArray(stack) ? stack.filter((item) => typeof item === "string") : [];
    } catch (error) {
      return [];
    }
  }

  function writeNavigationStack(stack) {
    sessionStorage.setItem(navigationStackKey, JSON.stringify(stack.slice(-40)));
  }

  function initializeNavigationStack() {
    const current = currentLocation();
    const returningTo = sessionStorage.getItem(returningToKey);
    let stack = readNavigationStack();

    if (returningTo === current) {
      sessionStorage.removeItem(returningToKey);
      if (stack.at(-1) !== current) stack.push(current);
    } else if (stack.at(-1) !== current) {
      stack.push(current);
    }

    if (isAppRoot(current)) stack = [current];
    writeNavigationStack(stack);
    return stack;
  }

  let navigationStack = initializeNavigationStack();

  function navigateToPreviousPage() {
    const current = currentLocation();
    while (navigationStack.length > 1 && navigationStack.at(-1) === current) {
      navigationStack.pop();
    }
    const target = navigationStack.at(-1);
    if (!target || target === current) return false;

    writeNavigationStack(navigationStack);
    sessionStorage.setItem(returningToKey, target);
    window.location.replace(target);
    return true;
  }

  function closeTransientSurface() {
    const dialogs = [...document.querySelectorAll("dialog[open]")];
    const dialog = dialogs.at(-1);
    if (dialog) {
      dialog.close();
      return true;
    }

    const bgm = document.querySelector("site-bgm");
    if (bgm?.panel && !bgm.panel.hidden && typeof bgm.closePanel === "function") {
      bgm.closePanel();
      return true;
    }

    const openDetails = [...document.querySelectorAll("details[open]")].at(-1);
    if (openDetails) {
      openDetails.open = false;
      return true;
    }

    const backEvent = new CustomEvent("ml:android-back", {
      cancelable: true,
    });
    if (!document.dispatchEvent(backEvent)) return true;

    return false;
  }

  function showExitHint() {
    if (!exitHint) {
      exitHint = document.createElement("div");
      exitHint.setAttribute("role", "status");
      exitHint.textContent = "再按一次返回键退出应用";
      Object.assign(exitHint.style, {
        position: "fixed",
        zIndex: "2147483647",
        right: "50%",
        bottom: "calc(26px + env(safe-area-inset-bottom, 0px))",
        padding: "9px 15px",
        color: "#fff",
        background: "rgba(36, 32, 51, 0.9)",
        borderRadius: "999px",
        boxShadow: "0 6px 20px rgba(36, 32, 51, 0.22)",
        fontSize: "13px",
        fontWeight: "700",
        pointerEvents: "none",
        transform: "translateX(50%)",
      });
    }
    if (!exitHint.isConnected) document.body.append(exitHint);
    window.clearTimeout(exitHintTimer);
    exitHintTimer = window.setTimeout(() => exitHint?.remove(), exitWindowMs);
  }

  app.addListener("backButton", ({ canGoBack }) => {
    if (closeTransientSurface()) return;

    if (!isAppRoot() && navigateToPreviousPage()) {
      lastExitRequest = 0;
      return;
    }

    if (!isAppRoot() && canGoBack) {
      lastExitRequest = 0;
      window.history.back();
      return;
    }

    const now = Date.now();
    if (now - lastExitRequest <= exitWindowMs) {
      app.exitApp();
      return;
    }

    lastExitRequest = now;
    showExitHint();
  });
})();
