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

  const performanceChartLine = document.getElementById("performanceChartLine");
  const performanceChartFill = document.getElementById("performanceChartFill");

  let chatPollInterval = null;
  let selectedAttachment = null;

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
    return new Date(dateString).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString([], {
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
    const token = localStorage.getItem("token");
    const userInfoRaw = localStorage.getItem("userInfo");
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
      sidebarUserStatus.textContent = user.kycStatus === "verified" ? "Verified User" : "Client User";
    }

    if (sidebarUserAvatar && user.profileImage) {
      sidebarUserAvatar.src = user.profileImage;
      sidebarUserAvatar.alt = user.fullName || "User";
    }
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
        fill: `${flat} V240 H0 Z`,
      };
    }

    const max = Math.max(...values);
    const min = Math.min(...values);

    if (max === min) {
      const flat = `M0 ${baselineY} L800 ${baselineY}`;
      return {
        line: flat,
        fill: `${flat} V240 H0 Z`,
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
    for (let i = 1; i < points.length; i++) {
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
      fill: `${line} V240 H0 Z`,
    };
  }

  function updateChart(monthlyProfit, totalDeposit, totalProfit) {
    const growth =
      totalDeposit > 0 ? ((totalProfit || 0) / totalDeposit) * 100 : 0;

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

    const values =
      growth <= 0
        ? [0, 0, 0, 0, 0, 0, 0]
        : [
            0,
            monthlyProfit * 0.18,
            monthlyProfit * 0.32,
            monthlyProfit * 0.48,
            monthlyProfit * 0.64,
            monthlyProfit * 0.82,
            monthlyProfit,
          ];

    const chartPath = buildChartPath(values);

    if (performanceChartLine) {
      performanceChartLine.setAttribute("d", chartPath.line);
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
            Your recent deposits, withdrawals, and profit credits will appear here.
          </p>
        </div>
      `;
      return;
    }

    recentTransactionsContainer.innerHTML = items
      .map((item) => {
        const isPositive = item.amount >= 0;
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
                  ${sign}${formatMoney(Math.abs(item.amount))}
                </p>
              </div>
            </button>
          </div>
        `;
      })
      .join("");
  }

  async function loadDashboardData(user) {
    try {
      const [depositsResponse, withdrawalsResponse, tradesResponse] = await Promise.all([
        window.API.get("/deposit/me").catch(() => null),
        window.API.get("/withdrawal/me").catch(() => null),
        window.API.get("/trading/my-trades").catch(() => null),
      ]);

      const deposits = depositsResponse?.data || [];
      const withdrawals = withdrawalsResponse?.data || [];
      const trades = tradesResponse?.data || [];

      const approvedDeposits = deposits.filter((d) => d.status === "approved");
      const approvedWithdrawals = withdrawals.filter((w) => w.status === "approved");
      const activeTrades = trades.filter((t) => t.status === "active");

      const totalDeposit = Number(user.totalDeposit || 0);
      const totalWithdrawal = Number(user.totalWithdrawal || 0);
      const totalProfit = Number(user.totalProfit || 0);
      const balance = Number(user.balance || 0);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyProfit = trades
        .filter((trade) => {
          if (trade.status !== "completed" || trade.result !== "profit" || !trade.completedAt) {
            return false;
          }
          const date = new Date(trade.completedAt);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, trade) => sum + Number(trade.profit || 0), 0);

      const depositChangePercent =
        balance > 0 && totalDeposit > 0 ? (totalDeposit / Math.max(balance, 1)) * 100 : 0;

      if (accountBalanceValue) {
        accountBalanceValue.textContent = formatMoney(balance);
      }

      if (totalDepositValue) {
        totalDepositValue.textContent = formatMoney(totalDeposit);
      }

      if (totalDepositMeta) {
        if (totalDeposit > 0) {
          totalDepositMeta.textContent = `+${depositChangePercent.toFixed(1)}% overall funding`;
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
            ? `${formatNumber(approvedWithdrawals.length)} approved withdrawal(s)`
            : "No approved withdrawals yet";
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
        monthlyProfitValue.textContent = formatMoney(monthlyProfit);
      }

      if (monthlyProfitMeta) {
        if (monthlyProfit > 0) {
          monthlyProfitMeta.textContent = "Profitable performance";
          monthlyProfitMeta.className =
            "text-emerald-400 text-sm mt-2 xl:mt-5 xl:leading-6";
        } else {
          monthlyProfitMeta.textContent = "No profit booked this month";
          monthlyProfitMeta.className =
            "text-slate-400 text-sm mt-2 xl:mt-5 xl:leading-6";
        }
      }

      updateChart(monthlyProfit, totalDeposit, totalProfit);

      const recentTransactions = [
        ...approvedDeposits.map((d) => ({
          type: "deposit",
          title: "Deposit",
          subtitle: `${formatDate(d.updatedAt || d.createdAt)} • ${d.coinType || "Crypto"}`,
          amount: Number(d.amount || 0),
          createdAt: new Date(d.updatedAt || d.createdAt).getTime(),
        })),

        ...approvedWithdrawals.map((w) => ({
          type: "withdrawal",
          title: "Withdrawal",
          subtitle: `${formatDate(w.updatedAt || w.createdAt)} • ${w.coinType || w.network || "Crypto"}`,
          amount: -Number(w.amount || 0),
          createdAt: new Date(w.updatedAt || w.createdAt).getTime(),
        })),

        ...trades
          .filter(
            (t) =>
              t.status === "completed" &&
              t.result === "profit" &&
              Number(t.profit || 0) > 0
          )
          .map((t) => ({
            type: "profit",
            title: "Profit Credit",
            subtitle: `${formatDate(t.completedAt || t.updatedAt || t.createdAt)} • ${t.symbol || "System"}`,
            amount: Number(t.profit || 0),
            createdAt: new Date(t.completedAt || t.updatedAt || t.createdAt).getTime(),
          })),

        ...trades
          .filter(
            (t) =>
              t.status === "completed" &&
              t.result === "loss" &&
              Number(t.loss || 0) > 0
          )
          .map((t) => ({
            type: "loss",
            title: "Loss Debit",
            subtitle: `${formatDate(t.completedAt || t.updatedAt || t.createdAt)} • ${t.symbol || "System"}`,
            amount: -Number(t.loss || 0),
            createdAt: new Date(t.completedAt || t.updatedAt || t.createdAt).getTime(),
          })),
      ]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 8);

      renderRecentTransactions(recentTransactions);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      showToast(error.message || "Unable to load dashboard data.", "error");

      if (accountBalanceValue) accountBalanceValue.textContent = formatMoney(0);
      if (totalDepositValue) totalDepositValue.textContent = formatMoney(0);
      if (totalWithdrawalValue) totalWithdrawalValue.textContent = formatMoney(0);
      if (openPositionsValue) openPositionsValue.textContent = "0";
      if (monthlyProfitValue) monthlyProfitValue.textContent = formatMoney(0);

      updateChart(0, 0, 0);
      renderRecentTransactions([]);
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
                    <span class="min-w-0 break-all">${escapeHtml(msg.attachmentName || "View attachment")}</span>
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
                    <span class="min-w-0 break-all">${escapeHtml(msg.attachmentName || "View attachment")}</span>
                  </a>
                `
                  : ""
              }
            </div>
            <p class="text-slate-500 text-[11px] mt-1 ml-1">
              ${msg.senderType === "system" ? "Support" : "Agent"} • ${formatTime(msg.createdAt)}
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
          <span class="max-w-[180px] truncate inline-block align-middle">${escapeHtml(file.name)}</span>
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
      showToast("Type a message or attach a file.", "error");
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
      showToast(error.message || "Unable to send message.", "error");
    }
  }

  function startChatPolling() {
    if (chatPollInterval) clearInterval(chatPollInterval);
    chatPollInterval = setInterval(loadChat, 5000);
  }

  const currentUser = await guardDashboard();
  if (!currentUser) return;

  hydrateSidebar(currentUser);
  ensureChatAttachmentUI();
  await loadDashboardData(currentUser);
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

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeChatModal();
      closeLogoutModal();
    }
  });

  chatForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await sendChatMessage();
  });
});