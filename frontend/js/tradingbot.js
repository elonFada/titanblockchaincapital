document.addEventListener("DOMContentLoaded", async () => {
  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  const mobileSidebarClose = document.getElementById("mobileSidebarClose");
  const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
  const dashboardSidebar = document.getElementById("dashboardSidebar");

  const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
  const sidebarUserName = document.getElementById("sidebarUserName");
  const sidebarUserStatus = document.getElementById("sidebarUserStatus");

  const pageLoader = document.getElementById("pageLoader");

  const inactiveBotSection = document.getElementById("inactiveBotSection");
  const activeBotSection = document.getElementById("activeBotSection");
  const paymentStatusNotice = document.getElementById("paymentStatusNotice");

  const openBotModalBtn = document.getElementById("openBotModal");
  const closeBotModalBtn = document.getElementById("closeBotModal");
  const botModal = document.getElementById("botModal");
  const botModalCard = document.getElementById("botModalCard");

  const botPaymentForm = document.getElementById("botPaymentForm");
  const botReceiptInput = document.getElementById("botReceiptInput");
  const botReceiptText = document.getElementById("botReceiptText");
  const submitBotPaymentBtn = document.getElementById("submitBotPaymentBtn");
  const copyBotWalletBtn = document.getElementById("copyBotWalletBtn");
  const botWalletAddress = document.getElementById("botWalletAddress");

  const botActivatedDate = document.getElementById("botActivatedDate");
  const botTotalTradesValue = document.getElementById("botTotalTradesValue");
  const botActiveTradesValue = document.getElementById("botActiveTradesValue");
  const botProfitTradesValue = document.getElementById("botProfitTradesValue");
  const botLossTradesValue = document.getElementById("botLossTradesValue");
  const botTradeHistoryContainer = document.getElementById(
    "botTradeHistoryContainer"
  );

  let currentUser = null;
  let currentPayment = null;
  let currentTrades = [];
  let botIsActive = false;
  let refreshInterval = null;
  let isRefreshing = false;

  function showPageLoader() {
    if (!pageLoader) return;
    pageLoader.classList.remove("hidden", "opacity-0", "pointer-events-none");
    pageLoader.classList.add("opacity-100");
  }

  function hidePageLoader() {
    if (!pageLoader) return;
    pageLoader.classList.remove("opacity-100");
    pageLoader.classList.add("opacity-0", "pointer-events-none");

    setTimeout(() => {
      pageLoader.classList.add("hidden");
    }, 300);
  }

  function getPageUrl(page) {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    return isLocal ? `/frontend/${page}` : `/${page}`;
  }

  function clearStoredAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userInfo");
  }

  function getStoredUser() {
    const raw =
      localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error("Failed to parse stored user info:", error);
      return null;
    }
  }

  function saveStoredUser(user) {
    if (!user) return;
    localStorage.setItem("userInfo", JSON.stringify(user));
    sessionStorage.setItem("userInfo", JSON.stringify(user));
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
    return `$${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString();
  }

  function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function truncateFileName(name, maxLength = 42) {
    if (!name) return "";
    if (name.length <= maxLength) return name;

    const dotIndex = name.lastIndexOf(".");
    const extension = dotIndex > -1 ? name.slice(dotIndex) : "";
    const baseName = dotIndex > -1 ? name.slice(0, dotIndex) : name;

    const allowedBaseLength = Math.max(10, maxLength - extension.length - 3);
    return `${baseName.slice(0, allowedBaseLength)}...${extension}`;
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

  function openBotModal() {
    if (!botModal || !botModalCard) return;

    botModal.classList.remove("modal-hidden");
    botModal.classList.add("modal-visible");
    botModalCard.classList.remove("modal-card-hidden");
    botModalCard.classList.add("modal-card-visible");
    document.body.classList.add("modal-open");
  }

  function closeBotModal() {
    if (!botModal || !botModalCard) return;

    botModal.classList.remove("modal-visible");
    botModal.classList.add("modal-hidden");
    botModalCard.classList.remove("modal-card-visible");
    botModalCard.classList.add("modal-card-hidden");
    document.body.classList.remove("modal-open");
  }

  async function guardPage() {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      clearStoredAuth();
      window.location.href = getPageUrl("login.html");
      return null;
    }

    try {
      const response = await window.API.get("/user/profile");
      const liveUser = response?.data || storedUser;
      saveStoredUser(liveUser);
      return liveUser;
    } catch (error) {
      console.error("Failed to load profile:", error);

      if (storedUser) {
        return storedUser;
      }

      clearStoredAuth();
      window.location.href = getPageUrl("login.html");
      return null;
    }
  }

  function hydrateSidebar(user) {
    if (!user) return;

    const profileImage = user.profileImage || "images/logo.png";
    const fullName = user.fullName || "Client Account";
    const statusText =
      user.kycStatus === "verified" ? "Verified User" : "Client User";

    if (sidebarUserAvatar) {
      sidebarUserAvatar.src = profileImage;
      sidebarUserAvatar.alt = fullName;
      sidebarUserAvatar.onerror = function () {
        this.onerror = null;
        this.src = "images/logo.png";
      };
    }

    if (sidebarUserName) {
      sidebarUserName.textContent = fullName;
    }

    if (sidebarUserStatus) {
      sidebarUserStatus.textContent = statusText;
    }
  }

  function setPaymentStatusNotice(payment) {
    if (!paymentStatusNotice) return;

    if (!payment || !payment.status || botIsActive) {
      paymentStatusNotice.classList.add("hidden");
      paymentStatusNotice.innerHTML = "";
      return;
    }

    const status = String(payment.status).toLowerCase();

    if (status === "pending") {
      paymentStatusNotice.classList.remove("hidden");
      paymentStatusNotice.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="h-11 w-11 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
            <i data-lucide="clock-3" class="w-5 h-5 text-yellow-400"></i>
          </div>
          <div class="min-w-0">
            <p class="text-yellow-400 text-sm font-bold uppercase tracking-widest">
              Payment Under Review
            </p>
            <h3 class="text-white text-xl sm:text-2xl font-black mt-2">
              Your trading bot payment is pending approval
            </h3>
            <p class="text-slate-300 text-sm sm:text-base leading-7 mt-3">
              Your activation payment has been submitted successfully and is currently under admin review.
            </p>
          </div>
        </div>
      `;
      return;
    }

    if (status === "rejected") {
      paymentStatusNotice.classList.remove("hidden");
      paymentStatusNotice.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="h-11 w-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <i data-lucide="circle-alert" class="w-5 h-5 text-red-400"></i>
          </div>
          <div class="min-w-0">
            <p class="text-red-400 text-sm font-bold uppercase tracking-widest">
              Payment Rejected
            </p>
            <h3 class="text-white text-xl sm:text-2xl font-black mt-2">
              Your previous trading bot payment was rejected
            </h3>
            <p class="text-slate-300 text-sm sm:text-base leading-7 mt-3">
              ${
                payment.rejectionReason
                  ? escapeHtml(payment.rejectionReason)
                  : "Please resubmit a clear payment proof for review."
              }
            </p>
          </div>
        </div>
      `;
      return;
    }

    paymentStatusNotice.classList.add("hidden");
    paymentStatusNotice.innerHTML = "";
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
          +${formatMoney(trade.profit || 0)}
        </p>
      `;
    }

    if (trade.result === "loss") {
      return `
        <p class="text-red-400 font-bold text-sm sm:text-base">
          -${formatMoney(trade.loss || 0)}
        </p>
      `;
    }

    return "";
  }

  function getTradeMetaText(trade) {
    if (trade.status === "active") {
      return `Accepted ${escapeHtml(
        formatDateTime(trade.createdAt || trade.updatedAt)
      )}`;
    }

    return `${escapeHtml(
      formatDateTime(trade.completedAt || trade.updatedAt || trade.createdAt)
    )} • Closed Trade`;
  }

  function getTradeHistoryCard(trade) {
    return `
      <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div class="w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-4 text-left">
          <div class="min-w-0">
            <p class="text-white font-bold text-sm sm:text-base">
              ${escapeHtml(trade.symbol || "Trade")}
            </p>
            <p class="text-slate-400 text-xs sm:text-sm mt-1">
              ${getTradeMetaText(trade)}
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            ${getTradeStatusBadge(trade)}
            ${getTradeAmountText(trade)}
          </div>
        </div>
      </div>
    `;
  }

  function renderBotTradeHistory(trades = []) {
    if (!botTradeHistoryContainer) return;

    if (!Array.isArray(trades) || !trades.length) {
      botTradeHistoryContainer.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div class="px-4 sm:px-5 py-6 text-center">
            <p class="text-white font-bold text-sm sm:text-base">
              No trade history yet
            </p>
            <p class="text-slate-400 text-xs sm:text-sm mt-2">
              Once your trading bot is active, every new admin signal will be accepted automatically and recorded here.
            </p>
          </div>
        </div>
      `;
      return;
    }

    botTradeHistoryContainer.innerHTML = trades
      .sort(
        (a, b) =>
          new Date(b.completedAt || b.updatedAt || b.createdAt).getTime() -
          new Date(a.completedAt || a.updatedAt || a.createdAt).getTime()
      )
      .map(getTradeHistoryCard)
      .join("");
  }

  function fillBotStats(trades = []) {
    const totalTrades = trades.length;
    const activeTrades = trades.filter((trade) => trade.status === "active").length;
    const profitTrades = trades.filter((trade) => trade.result === "profit").length;
    const lossTrades = trades.filter((trade) => trade.result === "loss").length;

    if (botTotalTradesValue) {
      botTotalTradesValue.textContent = formatNumber(totalTrades);
    }

    if (botActiveTradesValue) {
      botActiveTradesValue.textContent = formatNumber(activeTrades);
    }

    if (botProfitTradesValue) {
      botProfitTradesValue.textContent = formatNumber(profitTrades);
    }

    if (botLossTradesValue) {
      botLossTradesValue.textContent = formatNumber(lossTrades);
    }
  }

  function updateBotState() {
    if (botIsActive) {
      inactiveBotSection?.classList.add("hidden");
      activeBotSection?.classList.remove("hidden");

      if (botActivatedDate) {
        botActivatedDate.textContent = formatDateTime(
          currentUser?.tradingBotActivatedAt || currentPayment?.reviewedAt
        );
      }

      fillBotStats(currentTrades);
      renderBotTradeHistory(currentTrades);
      return;
    }

    inactiveBotSection?.classList.remove("hidden");
    activeBotSection?.classList.add("hidden");

    const paymentStatus = String(currentPayment?.status || "").toLowerCase();

    if (openBotModalBtn) {
      openBotModalBtn.disabled = paymentStatus === "pending";
      openBotModalBtn.classList.toggle("opacity-60", paymentStatus === "pending");
      openBotModalBtn.classList.toggle(
        "cursor-not-allowed",
        paymentStatus === "pending"
      );

      if (paymentStatus === "pending") {
        openBotModalBtn.textContent = "Payment Under Review";
      } else if (paymentStatus === "rejected") {
        openBotModalBtn.textContent = "Resubmit Trading Bot Payment";
      } else {
        openBotModalBtn.textContent = "Activate Trading Bot";
      }
    }
  }

  async function fetchBotPaymentStatus() {
    return window.API.get("/trading-bot/payment/me");
  }

  async function fetchMyTrades() {
    return window.API.get("/trading/my-trades");
  }

  async function loadTradingBotPageData(showToastOnError = true) {
    if (isRefreshing) return;
    isRefreshing = true;

    try {
      const [profileResponse, paymentResponse, tradesResponse] = await Promise.all([
        window.API.get("/user/profile").catch(() => null),
        fetchBotPaymentStatus().catch(() => null),
        fetchMyTrades().catch(() => null),
      ]);

      const liveUser = profileResponse?.data || currentUser || getStoredUser() || null;
      const payment = paymentResponse?.data || null;
      const botActiveFromApi = Boolean(paymentResponse?.botActive);
      const allTrades = Array.isArray(tradesResponse?.data) ? tradesResponse.data : [];

      currentUser = liveUser;
      currentPayment = payment;
      botIsActive = Boolean(botActiveFromApi || liveUser?.tradingBotSubscribed === true);

      if (liveUser) {
        saveStoredUser(liveUser);
        hydrateSidebar(liveUser);
      }

      currentTrades = botIsActive ? allTrades : [];

      setPaymentStatusNotice(payment);
      updateBotState();
    } catch (error) {
      console.error("Failed to load trading bot data:", error);

      if (showToastOnError && typeof showToast === "function") {
        showToast(error.message || "Unable to load trading bot details.", "error");
      }

      setPaymentStatusNotice(null);
      inactiveBotSection?.classList.remove("hidden");
      activeBotSection?.classList.add("hidden");
    } finally {
      isRefreshing = false;
    }
  }

  function startAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    refreshInterval = setInterval(() => {
      loadTradingBotPageData(false);
    }, 5000);
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  async function handleCopyWallet() {
    if (!botWalletAddress?.value) return;

    try {
      await navigator.clipboard.writeText(botWalletAddress.value);

      if (typeof showToast === "function") {
        showToast("Wallet address copied successfully.", "success");
      }
    } catch (error) {
      if (typeof showToast === "function") {
        showToast("Unable to copy wallet address.", "error");
      }
    }
  }

  async function handleBotPaymentSubmit(event) {
    event.preventDefault();

    const receiptFile = botReceiptInput?.files?.[0];
    if (!receiptFile) {
      showToast("Please upload your payment proof.", "error");
      return;
    }

    const originalText =
      submitBotPaymentBtn?.textContent || "Submit Activation Payment";

    if (submitBotPaymentBtn) {
      submitBotPaymentBtn.disabled = true;
      submitBotPaymentBtn.textContent = "Submitting...";
    }

    try {
      const formData = new FormData();
      formData.append("amount", "10000");
      formData.append("receipt", receiptFile);

      const response = await window.API.postForm("/trading-bot/payment", formData);

      if (typeof showToast === "function") {
        showToast(
          response?.message ||
            "Trading bot payment submitted successfully. Awaiting admin approval.",
          "success"
        );
      }

      botPaymentForm?.reset();

      if (botReceiptText) {
        botReceiptText.textContent =
          "Upload clear payment proof for activation review.";
      }

      closeBotModal();
      await loadTradingBotPageData(false);
    } catch (error) {
      console.error("Trading bot payment submission failed:", error);

      if (typeof showToast === "function") {
        showToast(
          error.message || "Failed to submit trading bot payment.",
          "error"
        );
      }
    } finally {
      if (submitBotPaymentBtn) {
        submitBotPaymentBtn.disabled = false;
        submitBotPaymentBtn.textContent = originalText;
      }
    }
  }

  showPageLoader();

  currentUser = await guardPage();
  if (!currentUser) {
    hidePageLoader();
    return;
  }

  hydrateSidebar(currentUser);

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  openBotModalBtn?.addEventListener("click", () => {
    if (openBotModalBtn.disabled) return;
    openBotModal();
  });

  closeBotModalBtn?.addEventListener("click", closeBotModal);

  botModal?.addEventListener("click", (event) => {
    if (event.target === botModal) {
      closeBotModal();
    }
  });

  copyBotWalletBtn?.addEventListener("click", handleCopyWallet);
  botPaymentForm?.addEventListener("submit", handleBotPaymentSubmit);

  botReceiptInput?.addEventListener("change", () => {
    const file = botReceiptInput.files?.[0];

    if (!botReceiptText) return;

    botReceiptText.textContent = file
      ? truncateFileName(file.name, 45)
      : "Upload clear payment proof for activation review.";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeBotModal();
      closeSidebar();
    }
  });

  await loadTradingBotPageData(false);
  startAutoRefresh();

  window.addEventListener("beforeunload", stopAutoRefresh);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoRefresh();
    } else {
      loadTradingBotPageData(false);
      startAutoRefresh();
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }

  hidePageLoader();
});