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

    if (user.kycStatus === "verified") {
      return;
    }

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
      return false;
    }

    if (!storedUser.isVerified) {
      window.location.href = getPageUrl("otp.html");
      return false;
    }

    try {
      const profileResponse = await window.API.get("/user/profile");
      const liveUser = profileResponse?.data || storedUser;

      localStorage.setItem("userInfo", JSON.stringify(liveUser));
      routeUser(liveUser);

      if (liveUser.kycStatus !== "verified") {
        return false;
      }

      return true;
    } catch (error) {
      console.warn("Unable to verify live dashboard session. Using stored user.");

      routeUser(storedUser);

      if (storedUser.kycStatus !== "verified") {
        return false;
      }

      return true;
    }
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

  const canStay = await guardDashboard();
  if (!canStay) return;

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  openChatModalBtn?.addEventListener("click", openChatModal);
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

  chatForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const message = chatInput?.value.trim() || "";
    if (!message) return;

    appendUserMessage(message);
    chatInput.value = "";

    setTimeout(() => {
      appendAgentReply(
        "Thank you for your message. An agent will respond shortly."
      );
    }, 700);
  });
});