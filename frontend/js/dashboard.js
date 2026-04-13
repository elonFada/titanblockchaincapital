document.addEventListener("DOMContentLoaded", async () => {
  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  const mobileSidebarClose = document.getElementById("mobileSidebarClose");
  const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
  const dashboardSidebar = document.getElementById("dashboardSidebar");

  const openChatModalBtn = document.getElementById("openChatModal");
  const openChatModalDesktopBtn = document.getElementById("openChatModalDesktop");
  const closeChatModalBtn = document.getElementById("closeChatModal");
  const chatModal = document.getElementById("chatModal");
  const chatModalCard = document.getElementById("chatModalCard");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatMessages = document.getElementById("chatMessages");

  const logoutBtn = document.getElementById("logoutBtn");
  const logoutModal = document.getElementById("logoutModal");
  const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");
  const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

  const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
  const sidebarUserName = document.getElementById("sidebarUserName");
  const sidebarUserStatus = document.getElementById("sidebarUserStatus");

  const accountBalanceValue = document.getElementById("accountBalanceValue");
  const totalDepositValue = document.getElementById("totalDepositValue");
  const totalDepositMeta = document.getElementById("totalDepositMeta");
  const totalWithdrawalValue = document.getElementById("totalWithdrawalValue");
  const totalWithdrawalMeta = document.getElementById("totalWithdrawalMeta");
  const openPositionsValue = document.getElementById("openPositionsValue");
  const openPositionsMeta = document.getElementById("openPositionsMeta");
  const monthlyProfitValue = document.getElementById("monthlyProfitValue");
  const monthlyProfitMeta = document.getElementById("monthlyProfitMeta");
  const growthValue = document.getElementById("growthValue");
  const recentTransactionsContainer = document.getElementById("recentTransactionsContainer");
  const tradingBotActionBtn = document.getElementById("tradingBotActionBtn");

  const referralBalanceValue = document.getElementById("referralBalanceValue");
  const referralBalanceMeta = document.getElementById("referralBalanceMeta");
  const openReferralWithdrawModalBtn = document.getElementById("openReferralWithdrawModal");
  const referralWithdrawModal = document.getElementById("referralWithdrawModal");
  const referralWithdrawForm = document.getElementById("referralWithdrawForm");
  const referralAvailableBalanceDisplay = document.getElementById("referralAvailableBalanceDisplay");
  const referralWithdrawAmountInput = document.getElementById("referralWithdrawAmount");
  const cancelReferralWithdrawBtn = document.getElementById("cancelReferralWithdrawBtn");
  const submitReferralWithdrawBtn = document.getElementById("submitReferralWithdrawBtn");

  const performanceChartLine = document.getElementById("performanceChartLine");
  const performanceChartFill = document.getElementById("performanceChartFill");
  const pageLoader = document.getElementById("pageLoader");

  let chatPollInterval = null;
  let selectedAttachment = null;
  let referralStatsState = {
    availableReferralBalance: 0,
    commissionEarned: 0,
    commissionPaid: 0,
    pendingWithdrawalAmount: 0,
  };

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
    sessionStorage.removeItem("pendingVerificationEmail");
    sessionStorage.removeItem("pendingVerificationToken");
    sessionStorage.removeItem("pendingVerificationPhone");
    sessionStorage.removeItem("pendingCountryCode");
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

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function escapeHtml(text = "") {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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

  function openChatModal() {
    if (!chatModal || !chatModalCard) return;

    chatModal.classList.remove("opacity-0", "invisible");
    chatModal.classList.add("opacity-100", "visible");

    setTimeout(() => {
      chatModalCard.classList.remove(
        "translate-y-8",
        "sm:translate-y-4",
        "scale-[0.98]",
        "opacity-0"
      );
      chatModalCard.classList.add(
        "translate-y-0",
        "scale-100",
        "opacity-100"
      );
    }, 10);

    document.body.classList.add("chat-modal-open");
  }

  function closeChatModal() {
    if (!chatModal || !chatModalCard) return;

    chatModalCard.classList.remove(
      "translate-y-0",
      "scale-100",
      "opacity-100"
    );
    chatModalCard.classList.add(
      "translate-y-8",
      "sm:translate-y-4",
      "scale-[0.98]",
      "opacity-0"
    );

    chatModal.classList.remove("opacity-100", "visible");
    chatModal.classList.add("opacity-0", "invisible");
    document.body.classList.remove("chat-modal-open");
  }

  function openLogoutModal() {
    if (!logoutModal) return;
    logoutModal.classList.add("active");
    document.body.classList.add("modal-open");
  }

  function closeLogoutModal() {
    if (!logoutModal) return;
    logoutModal.classList.remove("active");
    document.body.classList.remove("modal-open");
  }

  function openReferralWithdrawModal() {
    if (!referralWithdrawModal) return;
    if (referralAvailableBalanceDisplay) {
      referralAvailableBalanceDisplay.textContent = formatMoney(
        referralStatsState.availableReferralBalance
      );
    }
    referralWithdrawModal.classList.add("active");
    document.body.classList.add("modal-open");
  }

  function closeReferralWithdrawModal() {
    if (!referralWithdrawModal) return;
    referralWithdrawModal.classList.remove("active");
    document.body.classList.remove("modal-open");
    if (referralWithdrawForm) referralWithdrawForm.reset();
  }

  async function logoutUser() {
    try {
      await window.API.post("/user/logout", {});
    } catch (error) {
      console.warn("Logout request failed, clearing local session anyway.");
    }

    clearStoredAuth();
    window.location.href = getPageUrl("login.html");
  }

  function routeUser(user) {
    if (!user) {
      clearStoredAuth();
      window.location.href = getPageUrl("login.html");
      return;
    }

    if (!user.isVerified) {
      window.location.href = getPageUrl("otp.html");
      return;
    }

    if (user.kycStatus === "verified") return;

    if (user.kycStatus === "submitted") {
      window.location.href = getPageUrl("dashboard-pending.html");
      return;
    }

    if (user.kycStatus === "pending" || user.kycStatus === "rejected") {
      window.location.href = getPageUrl("registration-fee.html");
      return;
    }

    clearStoredAuth();
    window.location.href = getPageUrl("login.html");
  }

  async function guardDashboard() {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const userInfoRaw =
      localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");
    const storedUser = userInfoRaw ? JSON.parse(userInfoRaw) : null;

    if (!token || !storedUser) {
      clearStoredAuth();
      window.location.href = getPageUrl("login.html");
      return null;
    }

    try {
      const profileResponse = await window.API.get("/user/profile");
      const liveUser = profileResponse?.data || storedUser;

      localStorage.setItem("userInfo", JSON.stringify(liveUser));
      sessionStorage.setItem("userInfo", JSON.stringify(liveUser));
      routeUser(liveUser);

      if (liveUser.kycStatus !== "verified") return null;
      return liveUser;
    } catch (error) {
      routeUser(storedUser);

      if (storedUser.kycStatus !== "verified") return null;
      return storedUser;
    }
  }

  function hydrateSidebar(user) {
    if (!user) return;

    if (sidebarUserName) {
      sidebarUserName.textContent = user.fullName || "Client Account";
    }

    if (sidebarUserStatus) {
      sidebarUserStatus.textContent =
        user.kycStatus === "verified" ? "Verified User" : "Client User";
    }

    if (sidebarUserAvatar) {
      sidebarUserAvatar.src = user.profileImage || "images/logo.png";
      sidebarUserAvatar.alt = user.fullName || "User";
    }
  }

  function updateTradingBotButton(user) {
    if (!tradingBotActionBtn) return;

    const isActivated = Boolean(user?.tradingBotSubscribed);

    if (isActivated) {
      tradingBotActionBtn.textContent = "Activated";
      tradingBotActionBtn.href = "tradingbot.html";
      tradingBotActionBtn.className =
        "px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/15 transition-colors text-center";
      return;
    }

    tradingBotActionBtn.textContent = "Activate Bot";
    tradingBotActionBtn.href = "tradingbot.html";
    tradingBotActionBtn.className =
      "px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-colors text-center";
  }

  function buildChartPath(values) {
    const chartWidth = 800;
    const chartHeight = 240;
    const baselineY = 180;
    const topPadding = 45;
    const bottomPadding = 180;

    if (!values.length) {
      const flat = `M0 ${baselineY} L800 ${baselineY}`;
      return {
        line: flat,
        fill: `${flat} V${chartHeight} H0 Z`,
      };
    }

    const max = Math.max(...values);
    const min = Math.min(...values);

    if (max === min) {
      const flat = `M0 ${baselineY} L800 ${baselineY}`;
      return {
        line: flat,
        fill: `${flat} V${chartHeight} H0 Z`,
      };
    }

    const stepX = chartWidth / Math.max(values.length - 1, 1);

    const points = values.map((value, index) => {
      const x = index * stepX;
      const ratio = (value - min) / (max - min);
      const y = bottomPadding - ratio * (bottomPadding - topPadding);
      return { x, y };
    });

    let line = `M${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const current = points[i];
      const cx1 = prev.x + stepX / 3;
      const cy1 = prev.y;
      const cx2 = current.x - stepX / 3;
      const cy2 = current.y;
      line += ` C${cx1} ${cy1}, ${cx2} ${cy2}, ${current.x} ${current.y}`;
    }

    return {
      line,
      fill: `${line} V${chartHeight} H0 Z`,
    };
  }

  function updateChart(netMonthlyValue, currentBalance) {
    const safeBalance = Number(currentBalance || 0);
    const safeNet = Number(netMonthlyValue || 0);

    const growth = safeBalance > 0 ? (safeNet / safeBalance) * 100 : 0;

    if (growthValue) {
      const sign = growth > 0 ? "+" : "";
      growthValue.textContent = `${sign}${growth.toFixed(1)}%`;
      growthValue.className =
        growth > 0
          ? "text-emerald-400 font-bold"
          : growth < 0
            ? "text-red-400 font-bold"
            : "text-slate-400 font-bold";
    }

    const absoluteNet = Math.abs(safeNet);
    const values =
      absoluteNet <= 0
        ? [0, 0, 0, 0, 0, 0, 0]
        : [
            0,
            absoluteNet * 0.18,
            absoluteNet * 0.32,
            absoluteNet * 0.48,
            absoluteNet * 0.64,
            absoluteNet * 0.82,
            absoluteNet,
          ];

    const chartPath = buildChartPath(values);

    if (performanceChartLine) {
      performanceChartLine.setAttribute("d", chartPath.line);
      performanceChartLine.setAttribute(
        "stroke",
        safeNet < 0 ? "#ef4444" : "#e4b84f"
      );
    }

    if (performanceChartFill) {
      performanceChartFill.setAttribute("d", chartPath.fill);
    }
  }

  function renderRecentTransactions(items = []) {
    if (!recentTransactionsContainer) return;

    if (!items.length) {
      recentTransactionsContainer.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-5">
          <p class="text-white font-bold text-sm sm:text-base">No transactions yet</p>
          <p class="text-slate-400 text-xs sm:text-sm mt-1">
            Your recent deposits, withdrawals, profit credits, and loss debits will appear here.
          </p>
        </div>
      `;
      return;
    }

    recentTransactionsContainer.innerHTML = items
      .map((item) => {
        const isPositive = Number(item.amount || 0) >= 0;
        const colorClass = isPositive ? "text-emerald-400" : "text-red-400";
        const sign = isPositive ? "+" : "-";

        return `
          <div class="transaction-item rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <button
              type="button"
              class="transaction-toggle w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
            >
              <div class="min-w-0">
                <p class="text-white font-bold text-sm sm:text-base">
                  ${escapeHtml(item.title)}
                </p>
                <p class="text-slate-400 text-xs sm:text-sm mt-1">
                  ${escapeHtml(item.subtitle)}
                </p>
              </div>

              <div class="flex items-center gap-3 shrink-0">
                <p class="${colorClass} font-bold text-sm sm:text-base">
                  ${sign}${formatMoney(Math.abs(Number(item.amount || 0)))}
                </p>
              </div>
            </button>
          </div>
        `;
      })
      .join("");
  }

  function hydrateReferralCard(stats = {}) {
    const available = Number(stats.availableReferralBalance || 0);
    const earned = Number(stats.commissionEarned || 0);
    const paid = Number(stats.commissionPaid || 0);
    const pending = Number(stats.pendingWithdrawalAmount || 0);

    referralStatsState = {
      availableReferralBalance: available,
      commissionEarned: earned,
      commissionPaid: paid,
      pendingWithdrawalAmount: pending,
    };

    if (referralBalanceValue) {
      referralBalanceValue.textContent = formatMoney(available);
    }

    if (referralBalanceMeta) {
      referralBalanceMeta.textContent = `Total earned: ${formatMoney(
        earned
      )} • Withdrawn: ${formatMoney(paid)} • Pending: ${formatMoney(pending)}`;
    }

    if (referralAvailableBalanceDisplay) {
      referralAvailableBalanceDisplay.textContent = formatMoney(available);
    }

    if (openReferralWithdrawModalBtn) {
      const disabled = available <= 0;
      openReferralWithdrawModalBtn.disabled = disabled;
      openReferralWithdrawModalBtn.classList.toggle("opacity-60", disabled);
      openReferralWithdrawModalBtn.classList.toggle("cursor-not-allowed", disabled);
    }
  }

  async function loadReferralStats() {
    try {
      const response = await window.API.get("/referral/stats");
      const stats = response?.data?.stats || {};
      hydrateReferralCard(stats);
    } catch (error) {
      console.error("Failed to load referral stats:", error);
      hydrateReferralCard({});
    }
  }

  async function submitReferralWithdrawal(event) {
    event.preventDefault();

    const amount = Number(referralWithdrawAmountInput?.value || 0);

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid withdrawal amount.", "error");
      return;
    }

    if (amount > referralStatsState.availableReferralBalance) {
      showToast("Withdrawal amount exceeds available referral balance.", "error");
      return;
    }

    const originalText =
      submitReferralWithdrawBtn?.textContent || "Submit Request";

    if (submitReferralWithdrawBtn) {
      submitReferralWithdrawBtn.disabled = true;
      submitReferralWithdrawBtn.textContent = "Submitting...";
    }

    try {
      const response = await window.API.post("/referral/withdraw", { amount });

      showToast(
        response?.message || "Referral withdrawal request submitted successfully.",
        "success"
      );

      closeReferralWithdrawModal();
      await loadReferralStats();
    } catch (error) {
      console.error("Referral withdrawal request failed:", error);
      showToast(
        error.message || "Failed to submit referral withdrawal request.",
        "error"
      );
    } finally {
      if (submitReferralWithdrawBtn) {
        submitReferralWithdrawBtn.disabled = false;
        submitReferralWithdrawBtn.textContent = originalText;
      }
    }
  }

  async function loadDashboardData() {
    try {
      const [
        profileResponse,
        depositsResponse,
        withdrawalsResponse,
        tradesResponse,
        referralStatsResponse,
      ] = await Promise.all([
        window.API.get("/user/profile").catch(() => null),
        window.API.get("/deposit/me").catch(() => null),
        window.API.get("/withdrawal/me").catch(() => null),
        window.API.get("/trading/my-trades").catch(() => null),
        window.API.get("/referral/stats").catch(() => null),
      ]);

      const liveUser = profileResponse?.data || {};
      const deposits = Array.isArray(depositsResponse?.data)
        ? depositsResponse.data
        : [];
      const withdrawals = Array.isArray(withdrawalsResponse?.data)
        ? withdrawalsResponse.data
        : [];
      const trades = Array.isArray(tradesResponse?.data)
        ? tradesResponse.data
        : [];
      const referralStats = referralStatsResponse?.data?.stats || {};

      if (profileResponse?.data) {
        localStorage.setItem("userInfo", JSON.stringify(liveUser));
        sessionStorage.setItem("userInfo", JSON.stringify(liveUser));
        hydrateSidebar(liveUser);
        updateTradingBotButton(liveUser);
      }

      hydrateReferralCard(referralStats);

      const approvedDeposits = deposits.filter(
        (deposit) => deposit.status === "approved"
      );

      const processedWithdrawals = withdrawals.filter(
        (withdrawal) =>
          withdrawal.status === "approved" || withdrawal.status === "paid"
      );

      const activeTrades = trades.filter((trade) => trade.status === "active");

      const totalDeposit = Number(liveUser.totalDeposit || 0);
      const totalWithdrawal = Number(liveUser.totalWithdrawal || 0);
      const balance = Number(liveUser.balance || 0);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyCompletedTrades = trades.filter((trade) => {
        if (trade.status !== "completed" || !trade.completedAt) return false;
        const date = new Date(trade.completedAt);
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      });

      const monthlyProfitTotal = monthlyCompletedTrades
        .filter((trade) => trade.result === "profit")
        .reduce((sum, trade) => sum + Number(trade.profit || 0), 0);

      const monthlyLossTotal = monthlyCompletedTrades
        .filter((trade) => trade.result === "loss")
        .reduce((sum, trade) => sum + Number(trade.loss || 0), 0);

      const monthlyNetProfit = monthlyProfitTotal - monthlyLossTotal;

      const monthlyPerformancePercent =
        balance > 0 ? (monthlyNetProfit / balance) * 100 : 0;

      const depositChangePercent =
        balance > 0 && totalDeposit > 0
          ? (totalDeposit / Math.max(balance, 1)) * 100
          : 0;

      if (accountBalanceValue) {
        accountBalanceValue.textContent = formatMoney(balance);
      }

      if (totalDepositValue) {
        totalDepositValue.textContent = formatMoney(totalDeposit);
      }

      if (totalDepositMeta) {
        if (totalDeposit > 0) {
          totalDepositMeta.textContent = `+${depositChangePercent.toFixed(
            1
          )}% overall funding`;
          totalDepositMeta.className =
            "text-emerald-400 text-sm mt-2 xl:mt-5 xl:leading-6";
        } else {
          totalDepositMeta.textContent = "No approved deposit yet";
          totalDepositMeta.className =
            "text-slate-400 text-sm mt-2 xl:mt-5 xl:leading-6";
        }
      }

      if (totalWithdrawalValue) {
        totalWithdrawalValue.textContent = formatMoney(totalWithdrawal);
      }

      if (totalWithdrawalMeta) {
        totalWithdrawalMeta.textContent =
          totalWithdrawal > 0
            ? `${formatNumber(processedWithdrawals.length)} processed withdrawal(s)`
            : "No processed withdrawals yet";
      }

      if (openPositionsValue) {
        openPositionsValue.textContent = formatNumber(activeTrades.length);
      }

      if (openPositionsMeta) {
        openPositionsMeta.textContent =
          activeTrades.length > 0
            ? "Across Total Assets Trading"
            : "No active positions currently";
      }

      if (monthlyProfitValue) {
        monthlyProfitValue.textContent = formatMoney(monthlyNetProfit);
        monthlyProfitValue.className =
          monthlyNetProfit > 0
            ? "text-emerald-400 text-2xl font-black mt-4 xl:mt-6 xl:leading-none"
            : monthlyNetProfit < 0
              ? "text-red-400 text-2xl font-black mt-4 xl:mt-6 xl:leading-none"
              : "text-white text-2xl font-black mt-4 xl:mt-6 xl:leading-none";
      }

      if (monthlyProfitMeta) {
        if (monthlyNetProfit === 0) {
          monthlyProfitMeta.textContent = "0.0% this month";
          monthlyProfitMeta.className =
            "text-slate-400 text-sm mt-2 xl:mt-5 xl:leading-6";
        } else {
          const sign = monthlyPerformancePercent > 0 ? "+" : "";
          monthlyProfitMeta.textContent = `${sign}${monthlyPerformancePercent.toFixed(
            1
          )}% this month`;
          monthlyProfitMeta.className =
            monthlyPerformancePercent > 0
              ? "text-emerald-400 text-sm mt-2 xl:mt-5 xl:leading-6"
              : "text-red-400 text-sm mt-2 xl:mt-5 xl:leading-6";
        }
      }

      updateChart(monthlyNetProfit, balance);

      const recentTransactions = [
        ...approvedDeposits.map((deposit) => ({
          type: "deposit",
          title: "Deposit",
          subtitle: `${formatDate(
            deposit.updatedAt || deposit.createdAt
          )} • ${deposit.coinType || "Crypto"}`,
          amount: Number(deposit.amount || 0),
          createdAt: new Date(
            deposit.updatedAt || deposit.createdAt
          ).getTime(),
        })),

        ...processedWithdrawals.map((withdrawal) => ({
          type: "withdrawal",
          title: "Withdrawal",
          subtitle: `${formatDate(
            withdrawal.updatedAt || withdrawal.createdAt
          )} • ${withdrawal.coinType || withdrawal.network || "Crypto"}`,
          amount: -Number(withdrawal.amount || 0),
          createdAt: new Date(
            withdrawal.updatedAt || withdrawal.createdAt
          ).getTime(),
        })),

        ...trades
          .filter(
            (trade) =>
              trade.status === "completed" &&
              trade.result === "profit" &&
              Number(trade.profit || 0) > 0
          )
          .map((trade) => ({
            type: "profit",
            title: "Profit Credit",
            subtitle: `${formatDate(
              trade.completedAt || trade.updatedAt || trade.createdAt
            )} • ${trade.symbol || "System"}`,
            amount: Number(trade.profit || 0),
            createdAt: new Date(
              trade.completedAt || trade.updatedAt || trade.createdAt
            ).getTime(),
          })),

        ...trades
          .filter(
            (trade) =>
              trade.status === "completed" &&
              trade.result === "loss" &&
              Number(trade.loss || 0) > 0
          )
          .map((trade) => ({
            type: "loss",
            title: "Loss Debit",
            subtitle: `${formatDate(
              trade.completedAt || trade.updatedAt || trade.createdAt
            )} • ${trade.symbol || "System"}`,
            amount: -Number(trade.loss || 0),
            createdAt: new Date(
              trade.completedAt || trade.updatedAt || trade.createdAt
            ).getTime(),
          })),
      ]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 8);

      renderRecentTransactions(recentTransactions);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      if (typeof showToast === "function") {
        showToast(error.message || "Unable to load dashboard data.", "error");
      }

      if (accountBalanceValue) accountBalanceValue.textContent = formatMoney(0);
      if (totalDepositValue) totalDepositValue.textContent = formatMoney(0);
      if (totalWithdrawalValue) totalWithdrawalValue.textContent = formatMoney(0);
      if (openPositionsValue) openPositionsValue.textContent = "0";
      if (monthlyProfitValue) monthlyProfitValue.textContent = formatMoney(0);
      if (monthlyProfitMeta) {
        monthlyProfitMeta.textContent = "0.0% this month";
        monthlyProfitMeta.className =
          "text-slate-400 text-sm mt-2 xl:mt-5 xl:leading-6";
      }

      hydrateReferralCard({});
      updateChart(0, 0);
      renderRecentTransactions([]);
    } finally {
      hidePageLoader();
    }
  }

  function renderMessages(messages = []) {
    if (!chatMessages) return;

    chatMessages.innerHTML = "";

    messages.forEach((msg) => {
      const isUser = msg.senderType === "user";

      const wrapper = document.createElement("div");
      wrapper.className = isUser
        ? "flex items-start justify-end gap-3"
        : "flex items-start gap-3";

      if (isUser) {
        wrapper.innerHTML = `
          <div class="max-w-[82%]">
            <div class="rounded-2xl rounded-tr-md gold-gradient px-4 py-3 shadow-lg shadow-primary/10">
              ${
                msg.text
                  ? `<p class="text-black text-sm font-medium leading-6 break-words">${escapeHtml(msg.text)}</p>`
                  : ""
              }
              ${
                msg.attachmentUrl
                  ? `
                    <a
                      href="${msg.attachmentUrl}"
                      target="_blank"
                      class="mt-3 flex items-center gap-2 rounded-xl bg-black/10 px-3 py-2 text-black text-sm font-semibold break-all"
                    >
                      <i data-lucide="paperclip" class="w-4 h-4 shrink-0"></i>
                      <span class="min-w-0 break-all">${escapeHtml(
                        msg.attachmentName || "View attachment"
                      )}</span>
                    </a>
                  `
                  : ""
              }
            </div>
            <p class="text-slate-500 text-[11px] mt-1 text-right mr-1">
              You • ${formatTime(msg.createdAt)}
            </p>
          </div>
        `;
      } else {
        wrapper.innerHTML = `
          <div class="h-9 w-9 rounded-xl gold-gradient flex items-center justify-center shrink-0">
            <i data-lucide="user-round" class="w-4 h-4 text-black"></i>
          </div>
          <div class="max-w-[82%]">
            <div class="rounded-2xl rounded-tl-md bg-white/8 border border-white/10 px-4 py-3">
              ${
                msg.text
                  ? `<p class="text-white text-sm leading-6 break-words">${escapeHtml(msg.text)}</p>`
                  : ""
              }
              ${
                msg.attachmentUrl
                  ? `
                    <a
                      href="${msg.attachmentUrl}"
                      target="_blank"
                      class="mt-3 flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-primary text-sm font-semibold break-all"
                    >
                      <i data-lucide="paperclip" class="w-4 h-4 shrink-0"></i>
                      <span class="min-w-0 break-all">${escapeHtml(
                        msg.attachmentName || "View attachment"
                      )}</span>
                    </a>
                  `
                  : ""
              }
            </div>
            <p class="text-slate-500 text-[11px] mt-1 ml-1">
              ${msg.senderType === "system" ? "Support" : "Agent"} • ${formatTime(
                msg.createdAt
              )}
            </p>
          </div>
        `;
      }

      chatMessages.appendChild(wrapper);
    });

    if (window.lucide) window.lucide.createIcons();
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function loadChat() {
    try {
      const response = await window.API.get("/support-chat/me");
      const chat = response?.data;

      if (!chat) return;
      renderMessages(chat.messages || []);
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  }

  function ensureChatAttachmentUI() {
    if (!chatForm || document.getElementById("chatAttachmentInput")) return;

    const attachBtn = chatForm.querySelector('button[type="button"]');
    if (!attachBtn) return;

    attachBtn.id = "chatAttachmentLabel";

    const attachmentInput = document.createElement("input");
    attachmentInput.type = "file";
    attachmentInput.id = "chatAttachmentInput";
    attachmentInput.className = "hidden";
    attachmentInput.accept = ".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx";

    attachBtn.addEventListener("click", () => {
      attachmentInput.click();
    });

    attachmentInput.addEventListener("change", () => {
      const file = attachmentInput.files?.[0] || null;
      selectedAttachment = file;

      attachBtn.innerHTML = file
        ? `
            <i data-lucide="paperclip" class="w-4 h-4 shrink-0"></i>
            <span class="max-w-[180px] truncate inline-block align-middle">${escapeHtml(
              file.name
            )}</span>
          `
        : `
            <i data-lucide="paperclip" class="w-4 h-4"></i>
            Attach file
          `;

      if (window.lucide) window.lucide.createIcons();
    });

    chatForm.appendChild(attachmentInput);
  }

  async function sendChatMessage() {
    const text = chatInput?.value.trim() || "";

    if (!text && !selectedAttachment) {
      if (typeof showToast === "function") {
        showToast("Type a message or attach a file.", "error");
      }
      return;
    }

    const formData = new FormData();
    formData.append("text", text);

    if (selectedAttachment) {
      formData.append("attachment", selectedAttachment);
    }

    try {
      await window.API.postForm("/support-chat/message", formData);

      if (chatInput) chatInput.value = "";
      selectedAttachment = null;

      const attachmentInput = document.getElementById("chatAttachmentInput");
      const attachmentBtn = document.getElementById("chatAttachmentLabel");

      if (attachmentInput) attachmentInput.value = "";

      if (attachmentBtn) {
        attachmentBtn.innerHTML = `
          <i data-lucide="paperclip" class="w-4 h-4"></i>
          Attach file
        `;
      }

      if (window.lucide) window.lucide.createIcons();

      await loadChat();
    } catch (error) {
      if (typeof showToast === "function") {
        showToast(error.message || "Unable to send message.", "error");
      }
    }
  }

  function startChatPolling() {
    if (chatPollInterval) clearInterval(chatPollInterval);
    chatPollInterval = setInterval(loadChat, 5000);
  }

  showPageLoader();

  const currentUser = await guardDashboard();
  if (!currentUser) {
    hidePageLoader();
    return;
  }

  hydrateSidebar(currentUser);
  updateTradingBotButton(currentUser);
  ensureChatAttachmentUI();
  await loadDashboardData();
  await loadChat();
  startChatPolling();

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  openChatModalBtn?.addEventListener("click", async () => {
    openChatModal();
    await loadChat();
  });

  openChatModalDesktopBtn?.addEventListener("click", async () => {
    openChatModal();
    await loadChat();
  });

  closeChatModalBtn?.addEventListener("click", closeChatModal);

  chatModal?.addEventListener("click", (e) => {
    if (e.target === chatModal) {
      closeChatModal();
    }
  });

  logoutBtn?.addEventListener("click", openLogoutModal);
  cancelLogoutBtn?.addEventListener("click", closeLogoutModal);
  confirmLogoutBtn?.addEventListener("click", logoutUser);

  logoutModal?.addEventListener("click", (e) => {
    if (e.target === logoutModal) {
      closeLogoutModal();
    }
  });

  openReferralWithdrawModalBtn?.addEventListener("click", () => {
    if (referralStatsState.availableReferralBalance <= 0) {
      showToast("No available referral earnings to withdraw.", "error");
      return;
    }
    openReferralWithdrawModal();
  });

  cancelReferralWithdrawBtn?.addEventListener("click", closeReferralWithdrawModal);

  referralWithdrawModal?.addEventListener("click", (e) => {
    if (e.target === referralWithdrawModal) {
      closeReferralWithdrawModal();
    }
  });

  referralWithdrawForm?.addEventListener("submit", submitReferralWithdrawal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeChatModal();
      closeLogoutModal();
      closeReferralWithdrawModal();
    }
  });

  chatForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await sendChatMessage();
  });
});