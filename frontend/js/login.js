document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const submitBtn = document.getElementById("loginSubmitBtn");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("passwordInput");

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

  function storePendingVerification(email) {
    if (email) {
      sessionStorage.setItem("pendingVerificationEmail", email.toLowerCase().trim());
    }
  }

  async function tryRefreshProfileAndRedirect(user, token) {
    try {
      const profileResponse = await window.API.get("/user/profile");
      const liveUser = profileResponse?.data || user;

      localStorage.setItem("token", token);
      localStorage.setItem("userInfo", JSON.stringify(liveUser));

      routeUser(liveUser);
    } catch (error) {
      localStorage.setItem("token", token);
      localStorage.setItem("userInfo", JSON.stringify(user));
      routeUser(user);
    }
  }

  function routeUser(user) {
    if (!user) {
      showToast("Unable to determine account status.", "error");
      return;
    }

    if (!user.isVerified) {
      if (user.email) {
        sessionStorage.setItem("pendingVerificationEmail", user.email);
      }
      window.location.href = getPageUrl("otp.html");
      return;
    }

    if (user.kycStatus === "verified") {
      window.location.href = getPageUrl("dashboard.html");
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

    window.location.href = getPageUrl("registration-fee.html");
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput?.value.trim().toLowerCase() || "";
    const password = passwordInput?.value || "";

    if (!email || !password) {
      showToast("Please enter your email and password.", "error");
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in...";

    try {
      clearStoredAuth();

      const response = await window.API.post("/user/login", {
        email,
        password,
      });

      const token = response?.session?.token;
      const user = response?.user;

      if (!token || !user) {
        throw new Error("Login response was incomplete.");
      }

      await tryRefreshProfileAndRedirect(user, token);
    } catch (error) {
      const message = error.message || "Unable to log in right now.";

      if (
        message.toLowerCase().includes("account not verified") ||
        message.toLowerCase().includes("verification code has been sent")
      ) {
        storePendingVerification(email);
        showToast(message, "info");

        setTimeout(() => {
          window.location.href = getPageUrl("otp.html");
        }, 1200);
        return;
      }

      showToast(message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});