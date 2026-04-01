// public/js/trade.js
document.addEventListener("DOMContentLoaded", async () => {
  const liveSignalsContainer = document.getElementById("liveSignalsContainer");
  const tradeHistoryContainer = document.getElementById("tradeHistoryContainer");
  const liveSignalCount = document.getElementById("liveSignalCount");

  let refreshInterval = null;
  let isLoading = false;

  function getPageUrl(page) {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    return isLocal ? `/frontend/${page}` : `/${page}`;
  }

  function clearUserSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userInfo");
  }

  function guardUser() {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      clearUserSession();
      window.location.href = getPageUrl("login.html");
      return false;
    }

    return true;
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getLiveSignalCard(signal) {
    const acceptDisabled = signal.alreadyTaken === true;

    return `
      <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div class="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-5 py-4">
          <div class="min-w-0">
            <p class="text-white font-bold text-sm sm:text-base">
              ${escapeHtml(signal.symbol)}
            </p>
            <p class="text-slate-400 text-xs sm:text-sm mt-1">
              Entry ${formatNumber(signal.entryPoint)} • TP ${formatNumber(signal.takeProfit)} • SL ${formatNumber(signal.stopLoss)}
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <span class="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              Live
            </span>

            <button
              type="button"
              data-accept-signal="${escapeHtml(signal._id)}"
              ${acceptDisabled ? "disabled" : ""}
              class="px-4 py-2 rounded-xl ${
                acceptDisabled
                  ? "bg-white/5 border border-white/10 text-slate-400 cursor-not-allowed"
                  : "gold-gradient text-black"
              } text-sm font-bold"
            >
              ${acceptDisabled ? "Accepted" : "Accept"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function getTradeStatusBadge(trade) {
    if (trade.status === "active") {
      return `
        <span class="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          Active
        </span>
      `;
    }

    if (trade.result === "profit") {
      return `
        <span class="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          Profit
        </span>
      `;
    }

    if (trade.result === "loss") {
      return `
        <span class="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          Loss
        </span>
      `;
    }

    return `
      <span class="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
        ${escapeHtml(trade.status || "Unknown")}
      </span>
    `;
  }

  function getTradeAmountText(trade) {
    if (trade.result === "profit") {
      return `
        <p class="text-emerald-400 font-bold text-sm sm:text-base">
          +$${formatMoney(trade.profit || 0)}
        </p>
      `;
    }

    if (trade.result === "loss") {
      return `
        <p class="text-red-400 font-bold text-sm sm:text-base">
          -$${formatMoney(trade.loss || 0)}
        </p>
      `;
    }

    return `

    `;
  }

  function getTradeMetaText(trade) {
    if (trade.status === "active") {
      return `
        Accepted ${escapeHtml(
          formatDate(trade.createdAt || trade.updatedAt)
        )} 
      `;
    }

    return `
      ${escapeHtml(
        formatDate(trade.completedAt || trade.updatedAt || trade.createdAt)
      )} • Closed Trade
    `;
  }

  function getHistoryCard(trade) {
    return `
      <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <button
          type="button"
          class="w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
        >
          <div class="min-w-0">
            <p class="text-white font-bold text-sm sm:text-base">
              ${escapeHtml(trade.symbol)}
            </p>
            <p class="text-slate-400 text-xs sm:text-sm mt-1">
              ${getTradeMetaText(trade)}
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            ${getTradeStatusBadge(trade)}
            ${getTradeAmountText(trade)}
          </div>
        </button>
      </div>
    `;
  }

  async function fetchLiveSignals() {
    return window.API.get("/trading/signals/available");
  }

  async function fetchMyTrades() {
    return window.API.get("/trading/my-trades");
  }

  async function acceptSignal(signalId) {
    return window.API.post(`/trading/signal/${signalId}/take`, {});
  }

  function renderLiveSignals(signals) {
    if (!liveSignalsContainer) return;

    if (!signals.length) {
      liveSignalsContainer.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div class="px-4 sm:px-5 py-6 text-center">
            <p class="text-white font-bold text-sm sm:text-base">
              No live signals available
            </p>
            <p class="text-slate-400 text-xs sm:text-sm mt-2">
              Check back shortly. New trade opportunities will appear here automatically.
            </p>
          </div>
        </div>
      `;
      return;
    }

    liveSignalsContainer.innerHTML = signals.map(getLiveSignalCard).join("");
  }

  function renderTradeHistory(trades) {
    if (!tradeHistoryContainer) return;

    const historyTrades = Array.isArray(trades) ? trades : [];

    if (!historyTrades.length) {
      tradeHistoryContainer.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div class="px-4 sm:px-5 py-6 text-center">
            <p class="text-white font-bold text-sm sm:text-base">
              No trade history yet
            </p>
            <p class="text-slate-400 text-xs sm:text-sm mt-2">
              Accepted and completed trades will appear here.
            </p>
          </div>
        </div>
      `;
      return;
    }

    tradeHistoryContainer.innerHTML = historyTrades
      .sort(
        (a, b) =>
          new Date(b.completedAt || b.updatedAt || b.createdAt) -
          new Date(a.completedAt || a.updatedAt || a.createdAt)
      )
      .map(getHistoryCard)
      .join("");
  }

  async function loadTradePageData(showErrorToast = true) {
    if (isLoading) return;
    isLoading = true;

    try {
      const [liveSignalsResponse, myTradesResponse] = await Promise.all([
        fetchLiveSignals(),
        fetchMyTrades(),
      ]);

      const liveSignals = Array.isArray(liveSignalsResponse?.data)
        ? liveSignalsResponse.data
        : [];

      const myTrades = Array.isArray(myTradesResponse?.data)
        ? myTradesResponse.data
        : [];

      const takenSignalIds = new Set(
        myTrades
          .filter((trade) => trade.signal)
          .map((trade) =>
            typeof trade.signal === "object" && trade.signal !== null
              ? String(trade.signal._id || "")
              : String(trade.signal)
          )
          .filter(Boolean)
      );

      const mappedSignals = liveSignals.map((signal) => ({
        ...signal,
        alreadyTaken: takenSignalIds.has(String(signal._id)),
      }));

      renderLiveSignals(mappedSignals);
      renderTradeHistory(myTrades);

      if (liveSignalCount) {
        liveSignalCount.textContent = `${mappedSignals.length} Live Signal${
          mappedSignals.length === 1 ? "" : "s"
        } Available`;
      }
    } catch (error) {
      console.error("Failed to load trade page data:", error);

      if (showErrorToast && typeof showToast === "function") {
        showToast(error.message || "Failed to load trade signals.", "error");
      }

      if (liveSignalsContainer) {
        liveSignalsContainer.innerHTML = `
          <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div class="px-4 sm:px-5 py-6 text-center">
              <p class="text-red-400 font-bold text-sm sm:text-base">
                Failed to load live signals
              </p>
            </div>
          </div>
        `;
      }

      if (tradeHistoryContainer) {
        tradeHistoryContainer.innerHTML = `
          <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div class="px-4 sm:px-5 py-6 text-center">
              <p class="text-red-400 font-bold text-sm sm:text-base">
                Failed to load trade history
              </p>
            </div>
          </div>
        `;
      }
    } finally {
      isLoading = false;
    }
  }

  async function handleAcceptSignalClick(event) {
    const acceptBtn = event.target.closest("[data-accept-signal]");
    if (!acceptBtn) return;

    const signalId = acceptBtn.getAttribute("data-accept-signal");
    if (!signalId) return;

    const originalText = acceptBtn.textContent;
    acceptBtn.disabled = true;
    acceptBtn.textContent = "Accepting...";

    try {
      const response = await acceptSignal(signalId);

      if (typeof showToast === "function") {
        showToast(response?.message || "Trade accepted successfully.", "success");
      }

      await loadTradePageData(false);
    } catch (error) {
      console.error("Accept signal failed:", error);

      if (typeof showToast === "function") {
        showToast(error.message || "Failed to accept trade signal.", "error");
      }

      acceptBtn.disabled = false;
      acceptBtn.textContent = originalText;
    }
  }

  function startAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    refreshInterval = setInterval(() => {
      loadTradePageData(false);
    }, 5000);
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  if (!guardUser()) return;

  liveSignalsContainer?.addEventListener("click", handleAcceptSignalClick);

  await loadTradePageData();
  startAutoRefresh();

  window.addEventListener("beforeunload", stopAutoRefresh);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoRefresh();
    } else {
      loadTradePageData(false);
      startAutoRefresh();
    }
  });
});