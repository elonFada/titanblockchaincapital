document.addEventListener("DOMContentLoaded", async () => {
  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  const mobileSidebarClose = document.getElementById("mobileSidebarClose");
  const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
  const dashboardSidebar = document.getElementById("dashboardSidebar");

  const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
  const sidebarUserName = document.getElementById("sidebarUserName");
  const sidebarUserStatus = document.getElementById("sidebarUserStatus");

  const profileMainImage = document.getElementById("profileMainImage");
  const profileMainName = document.getElementById("profileMainName");
  const profileMainStatus = document.getElementById("profileMainStatus");
  const profileFullName = document.getElementById("profileFullName");
  const profileEmail = document.getElementById("profileEmail");

  const referralCodeDisplay = document.getElementById("referralCodeDisplay");
  const referralLinkDisplay = document.getElementById("referralLinkDisplay");
  const copyReferralCodeBtn = document.getElementById("copyReferralCodeBtn");
  const copyReferralLinkBtn = document.getElementById("copyReferralLinkBtn");

  const togglePasswordEdit = document.getElementById("togglePasswordEdit");
  const passwordPanel = document.getElementById("edit-password");
  const passwordForm = document.getElementById("passwordForm");
  const currentPasswordInput = document.getElementById("currentPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
  const updatePasswordBtn = document.getElementById("updatePasswordBtn");

  const walletNoticeCard = document.getElementById("walletNoticeCard");
  const walletAddressDisplay = document.getElementById("walletAddressDisplay");
  const walletTypeDisplay = document.getElementById("walletTypeDisplay");
  const walletActionCard = document.getElementById("walletActionCard");
  const walletLockedCard = document.getElementById("walletLockedCard");

  const openWalletModalBtn = document.getElementById("openWalletModal");
  const closeWalletModalBtn = document.getElementById("closeWalletModal");
  const walletModal = document.getElementById("walletModal");
  const walletModalCard = document.getElementById("walletModalCard");
  const walletForm = document.getElementById("walletForm");
  const walletTypeInput = document.getElementById("walletType");
  const walletAddressInput = document.getElementById("walletAddress");
  const walletConfirmCheckbox = document.getElementById("walletConfirmCheckbox");
  const saveWalletBtn = document.getElementById("saveWalletBtn");

  const passwordToggleButtons = document.querySelectorAll(".password-toggle");
  const pageLoader = document.getElementById("pageLoader");

  const referralState = {
    referralCode: "",
    referralLink: "",
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
  }

  function getStoredUser() {
    const raw =
      localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error("Failed to parse stored user:", error);
      return null;
    }
  }

  function saveStoredUser(user) {
    const hasLocal = !!localStorage.getItem("userInfo");
    const hasSession = !!sessionStorage.getItem("userInfo");

    if (hasLocal) {
      localStorage.setItem("userInfo", JSON.stringify(user));
    }

    if (hasSession) {
      sessionStorage.setItem("userInfo", JSON.stringify(user));
    }

    if (!hasLocal && !hasSession) {
      localStorage.setItem("userInfo", JSON.stringify(user));
    }
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

  function openWalletModal() {
    if (!walletModal || !walletModalCard) return;

    walletModal.classList.remove("modal-hidden");
    walletModal.classList.add("modal-visible");
    walletModalCard.classList.remove("modal-card-hidden");
    walletModalCard.classList.add("modal-card-visible");
    document.body.classList.add("modal-open");
  }

  function closeWalletModal() {
    if (!walletModal || !walletModalCard) return;

    walletModal.classList.remove("modal-visible");
    walletModal.classList.add("modal-hidden");
    walletModalCard.classList.remove("modal-card-visible");
    walletModalCard.classList.add("modal-card-hidden");
    document.body.classList.remove("modal-open");
  }

  function resetPasswordVisibility() {
    const passwordFields = [
      currentPasswordInput,
      newPasswordInput,
      confirmNewPasswordInput,
    ];

    passwordFields.forEach((input) => {
      if (input) input.type = "password";
    });

    passwordToggleButtons.forEach((button) => {
      button.innerHTML = '<i data-lucide="eye" class="w-5 h-5"></i>';
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function bindPasswordToggles() {
    passwordToggleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");
        const input = document.getElementById(targetId);

        if (!input) return;

        const isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";

        button.innerHTML = isHidden
          ? '<i data-lucide="eye-off" class="w-5 h-5"></i>'
          : '<i data-lucide="eye" class="w-5 h-5"></i>';

        if (window.lucide) {
          window.lucide.createIcons();
        }
      });
    });
  }

  function getWalletType(user) {
    return (
      user?.withdrawalWalletType ||
      user?.walletType ||
      user?.withdrawalWallet?.type ||
      ""
    );
  }

  function getWalletAddress(user) {
    return (
      user?.withdrawalWalletAddress ||
      user?.walletAddress ||
      user?.withdrawalWallet?.address ||
      ""
    );
  }

  function buildReferralLink(referralCode) {
    if (!referralCode) return "";

    const origin = window.location.origin;

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const pathname = window.location.pathname || "";
    const folder = pathname.substring(0, pathname.lastIndexOf("/") + 1);

    const registerPath = isLocal ? "register.html" : "register";

    return `${origin}${folder}${registerPath}?ref=${encodeURIComponent(referralCode)}`;
  }

  function hydrateReferral(user) {
    referralState.referralCode = user?.referralCode || "";
    referralState.referralLink = buildReferralLink(referralState.referralCode);

    if (referralCodeDisplay) {
      referralCodeDisplay.textContent =
        referralState.referralCode || "Not available";
    }

    if (referralLinkDisplay) {
      referralLinkDisplay.textContent =
        referralState.referralLink || "Not available";
    }
  }

  async function copyText(value, successMessage) {
    if (!value) {
      showToast("Nothing to copy.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      showToast(successMessage, "success");
    } catch (error) {
      console.error("Copy failed:", error);
      showToast("Failed to copy. Please copy manually.", "error");
    }
  }

  function hydrateProfile(user) {
    if (!user) return;

    const fullName = user.fullName || "Client Account";
    const email = user.email || "No email";
    const profileImage = user.profileImage || "images/logo.png";
    const statusText =
      user.kycStatus === "verified" ? "Verified User" : "Client User";

    if (sidebarUserAvatar) {
      sidebarUserAvatar.src = profileImage;
      sidebarUserAvatar.alt = fullName;
    }

    if (sidebarUserName) sidebarUserName.textContent = fullName;
    if (sidebarUserStatus) sidebarUserStatus.textContent = statusText;

    if (profileMainImage) {
      profileMainImage.src = profileImage;
      profileMainImage.alt = fullName;
    }

    if (profileMainName) profileMainName.textContent = fullName;
    if (profileMainStatus) profileMainStatus.textContent = statusText;
    if (profileFullName) profileFullName.textContent = fullName;
    if (profileEmail) profileEmail.textContent = email;

    const walletType = getWalletType(user);
    const walletAddress = getWalletAddress(user);
    const hasWallet = Boolean(walletType && walletAddress);

    if (hasWallet) {
      if (walletAddressDisplay) walletAddressDisplay.textContent = walletAddress;
      if (walletTypeDisplay) walletTypeDisplay.textContent = walletType;

      walletNoticeCard?.classList.add("hidden");
      walletActionCard?.classList.add("hidden");
      walletLockedCard?.classList.remove("hidden");
    } else {
      if (walletAddressDisplay) walletAddressDisplay.textContent = "Not Added Yet";
      if (walletTypeDisplay) walletTypeDisplay.textContent = "No wallet added";

      walletNoticeCard?.classList.remove("hidden");
      walletActionCard?.classList.remove("hidden");
      walletLockedCard?.classList.add("hidden");
    }

    hydrateReferral(user);
  }

  async function guardProfile() {
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

      if (storedUser) return storedUser;

      clearStoredAuth();
      window.location.href = getPageUrl("login.html");
      return null;
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();

    const currentPassword = currentPasswordInput?.value?.trim() || "";
    const newPassword = newPasswordInput?.value?.trim() || "";
    const confirmNewPassword = confirmNewPasswordInput?.value?.trim() || "";

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showToast("Please fill all password fields.", "error");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }

    const originalText = updatePasswordBtn?.textContent || "Update Password";

    if (updatePasswordBtn) {
      updatePasswordBtn.disabled = true;
      updatePasswordBtn.textContent = "Updating...";
    }

    try {
      const response = await window.API.post("/user/change-password", {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      showToast(response?.message || "Password changed successfully.", "success");
      passwordForm?.reset();
      passwordPanel?.classList.add("hidden");
      resetPasswordVisibility();
    } catch (error) {
      console.error("Password change failed:", error);
      showToast(error.message || "Failed to change password.", "error");
    } finally {
      if (updatePasswordBtn) {
        updatePasswordBtn.disabled = false;
        updatePasswordBtn.textContent = originalText;
      }
    }
  }

  async function handleWalletSave(event) {
    event.preventDefault();

    const walletType = walletTypeInput?.value?.trim() || "";
    const walletAddress = walletAddressInput?.value?.trim() || "";
    const confirmed = Boolean(walletConfirmCheckbox?.checked);

    if (!walletType || !walletAddress) {
      showToast("Please enter wallet type and wallet address.", "error");
      return;
    }

    if (!confirmed) {
      showToast("Please confirm the wallet warning checkbox.", "error");
      return;
    }

    const currentStoredUser = getStoredUser();
    const existingWalletType = getWalletType(currentStoredUser);
    const existingWalletAddress = getWalletAddress(currentStoredUser);

    if (existingWalletType && existingWalletAddress) {
      showToast(
        "Withdrawal wallet is already locked and cannot be changed.",
        "error"
      );
      closeWalletModal();
      return;
    }

    const originalText = saveWalletBtn?.textContent || "Save Wallet Address";

    if (saveWalletBtn) {
      saveWalletBtn.disabled = true;
      saveWalletBtn.textContent = "Saving...";
    }

    try {
      const response = await window.API.put("/user/profile", {
        withdrawalWalletType: walletType,
        withdrawalWalletAddress: walletAddress,
      });

      const updatedFromApi = response?.data || {};
      const mergedUser = {
        ...(currentStoredUser || {}),
        ...updatedFromApi,
        withdrawalWalletType: walletType,
        withdrawalWalletAddress: walletAddress,
      };

      saveStoredUser(mergedUser);
      hydrateProfile(mergedUser);

      showToast(response?.message || "Wallet address saved successfully.", "success");

      walletForm?.reset();
      closeWalletModal();
    } catch (error) {
      console.error("Wallet save failed:", error);
      showToast(error.message || "Failed to save wallet address.", "error");
    } finally {
      if (saveWalletBtn) {
        saveWalletBtn.disabled = false;
        saveWalletBtn.textContent = originalText;
      }
    }
  }

  showPageLoader();

  const currentUser = await guardProfile();
  if (!currentUser) {
    hidePageLoader();
    return;
  }

  hydrateProfile(currentUser);

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  togglePasswordEdit?.addEventListener("click", () => {
    passwordPanel?.classList.toggle("hidden");
  });

  passwordForm?.addEventListener("submit", handlePasswordChange);

  openWalletModalBtn?.addEventListener("click", openWalletModal);
  closeWalletModalBtn?.addEventListener("click", closeWalletModal);

  walletModal?.addEventListener("click", (e) => {
    if (e.target === walletModal) {
      closeWalletModal();
    }
  });

  walletForm?.addEventListener("submit", handleWalletSave);

  copyReferralCodeBtn?.addEventListener("click", () => {
    copyText(referralState.referralCode, "Referral code copied successfully.");
  });

  copyReferralLinkBtn?.addEventListener("click", () => {
    copyText(referralState.referralLink, "Referral link copied successfully.");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeWalletModal();
      closeSidebar();
    }
  });

  bindPasswordToggles();

  if (window.lucide) {
    window.lucide.createIcons();
  }

  hidePageLoader();
});