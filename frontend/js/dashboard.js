document.addEventListener("DOMContentLoaded", async () => {
  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  const mobileSidebarClose = document.getElementById("mobileSidebarClose");
  const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
  const dashboardSidebar = document.getElementById("dashboardSidebar");

  const openChatModalBtn = document.getElementById("openChatModal");
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
  const transactionsContainer = document.getElementById("recentTransactionsContainer");
  const chartLinePath = document.getElementById("performanceChartLine");
  const chartFillPath = document.getElementById("performanceChartFill");

  const sidebarName = document.getElementById("sidebarUserName");
  const sidebarStatus = document.getElementById("sidebarUserStatus");
  const sidebarAvatar = document.getElementById("sidebarUserAvatar");

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token") || "";

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

  function formatCurrency(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatPercent(value) {
    const amount = Number(value || 0);
    const sign = amount > 0 ? "+" : "";
    return `${sign}${amount.toFixed(1)}%`;
  }

  function formatDate(dateValue) {
    if (!dateValue) return "—";
    const date = new Date(dateValue);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function isCurrentMonth(dateValue) {
    const date = new Date(dateValue);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
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
      chatModalCard.classList.add("translate-y-0", "scale-100", "opacity-100");
    }, 10);

    document.body.classList.add("chat-modal-open");
  }

  function closeChatModal() {
    if (!chatModal || !chatModalCard) return;

    chatModalCard.classList.remove("translate-y-0", "scale-100", "opacity-100");
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

  async function logoutUser() {
    try {
      await window.API.post("/user/logout", {});
    } catch (error) {
      console.warn("Logout request failed, clearing local auth anyway.");
    }

    clearStoredAuth();
    window.location.href = getPageUrl("login.html");
  }

  function routeUser(user) {
    if (!user) {
      clearStoredAuth();
      window.location.href = getPageUrl("login.html");
      return false;
    }

    if (!user.isVerified) {
      window.location.href = getPageUrl("otp.html");
      return false;
    }

    if (user.kycStatus === "verified") {
      return true;
    }

    if (user.kycStatus === "submitted") {
      window.location.href = getPageUrl("dashboard-pending.html");
      return false;
    }

    if (user.kycStatus === "pending" || user.kycStatus === "rejected") {
      window.location.href = getPageUrl("registration-fee.html");
      return false;
    }

    clearStoredAuth();
    window.location.href = getPageUrl("login.html");
    return false;
  }

  async function guardDashboard() {
    const storedUserRaw = localStorage.getItem("userInfo");
    const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;

    if (!token || !storedUser) {
      clearStoredAuth();
      window.location.href = getPageUrl("login.html");
      return null;
    }

    try {
      const profileResponse = await window.API.get("/user/profile");
      const liveUser = profileResponse?.data || storedUser;

      localStorage.setItem("userInfo", JSON.stringify(liveUser));

      if (!routeUser(liveUser)) {
        return null;
      }

      return liveUser;
    } catch (error) {
      console.warn("Live profile fetch failed, falling back to stored user.");

      if (!routeUser(storedUser)) {
        return null;
      }

      return storedUser;
    }
  }

  function setUserIdentity(user) {
    if (sidebarName) {
      sidebarName.textContent = user.fullName || "Client Account";
    }

    if (sidebarStatus) {
      sidebarStatus.textContent =
        user.kycStatus === "verified" ? "Verified User" : "Pending User";
    }

    if (sidebarAvatar) {
      if (user.profileImage) {
        sidebarAvatar.src = user.profileImage;
        sidebarAvatar.alt = user.fullName || "User";
      } else {
        sidebarAvatar.src = "images/logo.png";
        sidebarAvatar.alt = "Titan Logo";
      }
    }
  }

  async function safeGet(endpoint, fallback = null) {
    try {
      return await window.API.get(endpoint);
    } catch (error) {
      console.warn(`Failed to fetch ${endpoint}:`, error.message);
      return fallback;
    }
  }

  function buildChartPoints(completedTrades, balance) {
    const sortedTrades = [...completedTrades].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    if (!sortedTrades.length) {
      return [20, 28, 35, 40, 46, 55, 62, 70];
    }

    let runningValue = Math.max(Number(balance || 0) - 1, 1);

    const points = sortedTrades.map((trade) => {
      const profit = Number(trade.profit || 0);
      const loss = Number(trade.loss || 0);
      runningValue += profit - loss;
      return Math.max(runningValue, 1);
    });

    if (points.length === 1) {
      return [points[0] * 0.92, points[0]];
    }

    return points.slice(-8);
  }

  function renderPerformanceChart(completedTrades, balance) {
    if (!chartLinePath || !chartFillPath) return;

    const values = buildChartPoints(completedTrades, balance);
    const width = 800;
    const height = 240;
    const baseY = 220;

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = Math.max(maxValue - minValue, 1);
    const stepX = values.length > 1 ? width / (values.length - 1) : width;

    const points = values.map((value, index) => {
      const x = index * stepX;
      const normalized = (value - minValue) / range;
      const y = baseY - normalized * 140;
      return { x, y };
    });

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const curr = points[i];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }

    const fillPath = `${linePath} V ${height} H 0 Z`;

    chartLinePath.setAttribute("d", linePath);
    chartFillPath.setAttribute("d", fillPath);
  }

  function renderTransactions(deposits, withdrawals, trades) {
    if (!transactionsContainer) return;

    const approvedDeposits = deposits
      .filter((item) => item.status === "approved")
      .map((item) => ({
        type: "Deposit",
        date: item.createdAt,
        meta: `${formatDate(item.createdAt)} • ${item.coinType || "Crypto"}`,
        amount: Number(item.amount || 0),
        direction: "positive",
      }));

    const approvedWithdrawals = withdrawals
      .filter((item) => item.status === "approved")
      .map((item) => ({
        type: "Withdrawal",
        date: item.createdAt,
        meta: `${formatDate(item.createdAt)} • ${item.coinType || item.network || "Crypto"}`,
        amount: Number(item.amount || 0),
        direction: "negative",
      }));

    const completedTrades = trades
      .filter((item) => item.status === "completed")
      .map((item) => ({
        type: item.result === "profit" ? "Profit Credit" : "Trade Loss",
        date: item.completedAt || item.updatedAt || item.createdAt,
        meta: `${formatDate(item.completedAt || item.updatedAt || item.createdAt)} • ${item.symbol || "Trade"}`,
        amount:
          item.result === "profit"
            ? Number(item.profit || 0)
            : Number(item.loss || 0),
        direction: item.result === "profit" ? "positive" : "negative",
      }));

    const merged = [...approvedDeposits, ...approvedWithdrawals, ...completedTrades]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    if (!merged.length) {
      transactionsContainer.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-white/5 px-4 sm:px-5 py-5">
          <p class="text-white font-semibold">No recent transactions yet</p>
          <p class="text-slate-400 text-sm mt-2">
            Your approved deposits, withdrawals, and completed trade results will appear here.
          </p>
        </div>
      `;
      return;
    }

    transactionsContainer.innerHTML = merged
      .map((item) => {
        const amountClass =
          item.direction === "positive" ? "text-emerald-400" : "text-red-400";
        const amountPrefix = item.direction === "positive" ? "+" : "-";

        return `
          <div class="transaction-item rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <button
              type="button"
              class="transaction-toggle w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
            >
              <div class="min-w-0">
                <p class="text-white font-bold text-sm sm:text-base">
                  ${escapeHtml(item.type)}
                </p>
                <p class="text-slate-400 text-xs sm:text-sm mt-1">
                  ${escapeHtml(item.meta)}
                </p>
              </div>

              <div class="flex items-center gap-3 shrink-0">
                <p class="${amountClass} font-bold text-sm sm:text-base">
                  ${amountPrefix}${formatCurrency(item.amount).replace("$", "$")}
                </p>
              </div>
            </button>
          </div>
        `;
      })
      .join("");
  }

  function updateDashboardStats(user, deposits, withdrawals, trades) {
    const approvedDeposits = deposits.filter((item) => item.status === "approved");
    const approvedWithdrawals = withdrawals.filter(
      (item) => item.status === "approved"
    );
    const activeTrades = trades.filter((item) => item.status === "active");
    const completedProfitTrades = trades.filter(
      (item) => item.status === "completed" && item.result === "profit"
    );

    const totalDepositAmount = approvedDeposits.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
    const totalWithdrawalAmount = approvedWithdrawals.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const monthlyDepositAmount = approvedDeposits
      .filter((item) => isCurrentMonth(item.createdAt))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const monthlyProfitAmount = completedProfitTrades
      .filter((item) => isCurrentMonth(item.completedAt || item.updatedAt || item.createdAt))
      .reduce((sum, item) => sum + Number(item.profit || 0), 0);

    const depositGrowthPercent =
      totalDepositAmount > 0 ? (monthlyDepositAmount / totalDepositAmount) * 100 : 0;

    const chartSourceTrades = trades.filter((item) => item.status === "completed");
    const growthPercent =
      user.balance > 0 && user.totalProfit > 0
        ? (Number(user.totalProfit || 0) / Math.max(Number(user.balance || 1), 1)) * 100
        : 0;

    if (accountBalanceValue) {
      accountBalanceValue.textContent = formatCurrency(user.balance || 0);
    }

    if (totalDepositValue) {
      totalDepositValue.textContent = formatCurrency(
        user.totalDeposit ?? totalDepositAmount
      );
    }

    if (totalDepositMeta) {
      totalDepositMeta.textContent =
        monthlyDepositAmount > 0
          ? `${formatPercent(depositGrowthPercent)} this month`
          : "No approved deposit this month";
      totalDepositMeta.className =
        monthlyDepositAmount > 0
          ? "text-emerald-400 text-sm mt-2 xl:mt-5 xl:leading-6"
          : "text-slate-400 text-sm mt-2 xl:mt-5 xl:leading-6";
    }

    if (totalWithdrawalValue) {
      totalWithdrawalValue.textContent = formatCurrency(
        user.totalWithdrawal ?? totalWithdrawalAmount
      );
    }

    if (totalWithdrawalMeta) {
      totalWithdrawalMeta.textContent =
        approvedWithdrawals.length > 0
          ? "Processed successfully"
          : "No approved withdrawals yet";
    }

    if (openPositionsValue) {
      openPositionsValue.textContent = String(activeTrades.length);
    }

    if (openPositionsMeta) {
      openPositionsMeta.textContent =
        activeTrades.length > 0
          ? "Across active trading positions"
          : "No active positions currently";
    }

    if (monthlyProfitValue) {
      monthlyProfitValue.textContent = formatCurrency(monthlyProfitAmount);
    }

    if (monthlyProfitMeta) {
      monthlyProfitMeta.textContent =
        monthlyProfitAmount > 0
          ? "Profitable performance"
          : "No profit booked this month";
      monthlyProfitMeta.className =
        monthlyProfitAmount > 0
          ? "text-emerald-400 text-sm mt-2 xl:mt-5 xl:leading-6"
          : "text-slate-400 text-sm mt-2 xl:mt-5 xl:leading-6";
    }

    if (growthValue) {
      growthValue.textContent = formatPercent(growthPercent);
    }

    renderPerformanceChart(chartSourceTrades, user.balance || 0);
    renderTransactions(deposits, withdrawals, trades);
  }

  function appendUserMessage(message) {
    if (!chatMessages) return;

    const wrapper = document.createElement("div");
    wrapper.className = "flex items-start justify-end gap-3";

    wrapper.innerHTML = `
      <div class="max-w-[82%]">
        <div class="rounded-2xl rounded-tr-md gold-gradient px-4 py-3">
          <p class="text-black text-sm font-medium leading-6"></p>
        </div>
        <p class="text-slate-500 text-[11px] mt-1 text-right mr-1">You • just now</p>
      </div>
    `;

    const textNode = wrapper.querySelector("p.text-black");
    if (textNode) textNode.textContent = message;

    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendAgentReply(message) {
    if (!chatMessages) return;

    const reply = document.createElement("div");
    reply.className = "flex items-start gap-3";

    reply.innerHTML = `
      <div class="h-9 w-9 rounded-xl gold-gradient flex items-center justify-center shrink-0">
        <i data-lucide="user-round" class="w-4 h-4 text-black"></i>
      </div>
      <div class="max-w-[82%]">
        <div class="rounded-2xl rounded-tl-md bg-white/8 border border-white/10 px-4 py-3">
          <p class="text-white text-sm leading-6"></p>
        </div>
        <p class="text-slate-500 text-[11px] mt-1 ml-1">Agent • just now</p>
      </div>
    `;

    const textNode = reply.querySelector("p.text-white");
    if (textNode) textNode.textContent = message;

    chatMessages.appendChild(reply);
    if (window.lucide) window.lucide.createIcons();
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  const user = await guardDashboard();
  if (!user) return;

  setUserIdentity(user);

  const [depositsRes, withdrawalsRes, tradesRes] = await Promise.all([
    safeGet("/deposit/me", { data: [] }),
    safeGet("/withdrawal/me", { data: [] }),
    safeGet("/trading/my-trades", { data: [] }),
  ]);

  const deposits = Array.isArray(depositsRes?.data) ? depositsRes.data : [];
  const withdrawals = Array.isArray(withdrawalsRes?.data) ? withdrawalsRes.data : [];
  const trades = Array.isArray(tradesRes?.data) ? tradesRes.data : [];

  updateDashboardStats(user, deposits, withdrawals, trades);

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  openChatModalBtn?.addEventListener("click", openChatModal);
  closeChatModalBtn?.addEventListener("click", closeChatModal);

  chatModal?.addEventListener("click", (e) => {
    if (e.target === chatModal) closeChatModal();
  });

  logoutBtn?.addEventListener("click", openLogoutModal);
  cancelLogoutBtn?.addEventListener("click", closeLogoutModal);
  confirmLogoutBtn?.addEventListener("click", logoutUser);

  logoutModal?.addEventListener("click", (e) => {
    if (e.target === logoutModal) closeLogoutModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeChatModal();
      closeLogoutModal();
    }
  });

  chatForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const message = chatInput?.value.trim() || "";
    if (!message) return;

    appendUserMessage(message);
    chatInput.value = "";

    setTimeout(() => {
      appendAgentReply("Thank you for your message. An agent will respond shortly.");
    }, 700);
  });
});