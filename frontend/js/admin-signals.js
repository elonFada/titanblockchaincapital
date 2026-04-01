// public/js/admin-signals.js
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("signalForm");
  const submitBtn = document.getElementById("createSignalBtn");
  const signalsTableBody = document.getElementById("signalsTableBody");

  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  const mobileSidebarClose = document.getElementById("mobileSidebarClose");
  const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
  const dashboardSidebar = document.getElementById("dashboardSidebar");

  function getPageUrl(page) {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    return isLocal ? `/frontend/${page}` : `/${page}`;
  }

  function clearAdminSession() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("adminInfo");
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("adminInfo");
  }

  function guardAdmin() {
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");

    if (!token) {
      clearAdminSession();
      window.location.href = getPageUrl("admin-login.html");
      return false;
    }

    return true;
  }

  function openSidebar() {
    if (!dashboardSidebar || !mobileSidebarOverlay) return;

    dashboardSidebar.classList.remove("-translate-x-full");
    mobileSidebarOverlay.classList.remove("opacity-0", "invisible");
    mobileSidebarOverlay.classList.add("opacity-100", "visible");
    document.body.classList.add("sidebar-open");
  }

  function closeSidebar() {
    if (!dashboardSidebar || !mobileSidebarOverlay) return;

    dashboardSidebar.classList.add("-translate-x-full");
    mobileSidebarOverlay.classList.remove("opacity-100", "visible");
    mobileSidebarOverlay.classList.add("opacity-0", "invisible");
    document.body.classList.remove("sidebar-open");
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatRelativeOrDate(dateValue) {
    if (!dateValue) return "";

    const now = new Date();
    const target = new Date(dateValue);

    if (Number.isNaN(target.getTime())) return "";

    const diffMs = target.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHours > 0) {
      if (diffHours < 24) {
        return `Expires in ${diffHours} hour${diffHours === 1 ? "" : "s"}`;
      }

      const diffDays = Math.round(diffHours / 24);
      return `Expires in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
    }

    return `Created ${target.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  function getOutcomeType(signal) {
    if (Number(signal.profitPercentage || 0) > 0) return "profit";
    if (Number(signal.lossPercentage || 0) > 0) return "loss";
    return "";
  }

  function getOutcomeBadge(signal) {
    const outcomeType = getOutcomeType(signal);

    if (outcomeType === "profit") {
      return `<span class="status-pill status-profit">Profit</span>`;
    }

    if (outcomeType === "loss") {
      return `<span class="status-pill status-loss">Loss</span>`;
    }

    return `<span class="status-pill status-live">Signal</span>`;
  }

  function getStatusBadge(status) {
    if (status === "active") {
      return `<span class="status-pill status-live">Live</span>`;
    }

    if (status === "completed") {
      return `<span class="status-pill status-profit">Closed</span>`;
    }

    if (status === "expired") {
      return `<span class="status-pill status-loss">Expired</span>`;
    }

    return `<span class="status-pill status-live">${escapeHtml(status || "Unknown")}</span>`;
  }

  function getSignalRow(signal) {
    const percentage =
      Number(signal.profitPercentage || 0) > 0
        ? Number(signal.profitPercentage || 0)
        : Number(signal.lossPercentage || 0);

    const createdOrExpiryText =
      signal.status === "active"
        ? formatRelativeOrDate(signal.expiresAt || signal.createdAt)
        : signal.completedAt
          ? `Closed ${new Date(signal.completedAt).toLocaleString([], {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}`
          : `Created ${new Date(signal.createdAt).toLocaleString([], {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}`;

    return `
      <tr>
        <td class="py-4 pr-4">
          <p class="text-white font-bold">${escapeHtml(signal.symbol)}</p>
          <p class="text-slate-400 text-sm mt-1">${escapeHtml(createdOrExpiryText)}</p>
        </td>

        <td class="py-4 pr-4 text-slate-300">
          Entry ${formatNumber(signal.entryPoint)} • TP ${formatNumber(signal.takeProfit)} • SL ${formatNumber(signal.stopLoss)}
        </td>

        <td class="py-4 pr-4">
          ${getOutcomeBadge(signal)}
        </td>

        <td class="py-4 pr-4 text-white font-bold">
          ${formatNumber(percentage)}%
        </td>

        <td class="py-4 pr-4">
          ${getStatusBadge(signal.status)}
        </td>

        <td class="py-4">
          <div class="flex gap-2">
            ${
              signal.status === "active"
                ? `
                  <button
                    type="button"
                    data-close-trade="${signal._id}"
                    class="px-4 py-2 rounded-xl gold-gradient text-black text-sm font-bold"
                  >
                    Close Trade
                  </button>
                `
                : `
                  <button
                    type="button"
                    class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold cursor-default"
                    disabled
                  >
                    View
                  </button>
                `
            }
          </div>
        </td>
      </tr>
    `;
  }

  async function fetchSignals() {
    return window.API.get("/trading/signals");
  }

  async function createSignal(payload) {
    return window.API.post("/trading/signal", payload);
  }

  async function closeTrade(signalId) {
    return window.API.post(`/trading/signal/${signalId}/complete`, {});
  }

  async function loadSignals() {
    if (!signalsTableBody) return;

    try {
      const response = await fetchSignals();
      const signals = Array.isArray(response?.data) ? response.data : [];

      if (!signals.length) {
        signalsTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="py-8 text-center text-slate-400">
              No trade signals available yet.
            </td>
          </tr>
        `;
        return;
      }

      signalsTableBody.innerHTML = signals.map(getSignalRow).join("");
    } catch (error) {
      console.error("Failed to load signals:", error);

      signalsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="py-8 text-center text-red-400">
            Failed to load trade signals.
          </td>
        </tr>
      `;

      if (typeof showToast === "function") {
        showToast(error.message || "Failed to load signals.", "error");
      }
    }
  }

  async function handleCreateSignal(event) {
    event.preventDefault();

    if (!form || !submitBtn) return;

    const symbol = document.getElementById("signalSymbol")?.value?.trim() || "";
    const entryPoint = document.getElementById("signalEntry")?.value?.trim() || "";
    const takeProfit =
      document.getElementById("signalTakeProfit")?.value?.trim() || "";
    const stopLoss =
      document.getElementById("signalStopLoss")?.value?.trim() || "";
    const outcomeType =
      document.getElementById("signalOutcomeType")?.value?.trim() || "";
    const percentage =
      document.getElementById("signalOutcomePercent")?.value?.trim() || "";

    if (!symbol || !entryPoint || !takeProfit || !stopLoss || !outcomeType || !percentage) {
      if (typeof showToast === "function") {
        showToast("Please fill all required fields.", "error");
      }
      return;
    }

    const payload = {
      symbol,
      entryPoint: Number(entryPoint),
      takeProfit: Number(takeProfit),
      stopLoss: Number(stopLoss),
      outcomeType,
      percentage: Number(percentage),
    };

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating...";

    try {
      const response = await createSignal(payload);

      if (typeof showToast === "function") {
        showToast(response?.message || "Signal created successfully.", "success");
      }

      form.reset();
      await loadSignals();
    } catch (error) {
      console.error("Create signal failed:", error);

      if (typeof showToast === "function") {
        showToast(error.message || "Failed to create signal.", "error");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  async function handleSignalsTableClick(event) {
    const closeTradeBtn = event.target.closest("[data-close-trade]");
    if (!closeTradeBtn) return;

    const signalId = closeTradeBtn.getAttribute("data-close-trade");
    if (!signalId) return;

    closeTradeBtn.disabled = true;
    const originalText = closeTradeBtn.textContent;
    closeTradeBtn.textContent = "Closing...";

    try {
      const response = await closeTrade(signalId);

      if (typeof showToast === "function") {
        showToast(response?.message || "Trade closed successfully.", "success");
      }

      await loadSignals();
    } catch (error) {
      console.error("Close trade failed:", error);

      if (typeof showToast === "function") {
        showToast(error.message || "Failed to close trade.", "error");
      }

      closeTradeBtn.disabled = false;
      closeTradeBtn.textContent = originalText;
    }
  }

  if (!guardAdmin()) return;

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  form?.addEventListener("submit", handleCreateSignal);
  signalsTableBody?.addEventListener("click", handleSignalsTableClick);

  await loadSignals();
});