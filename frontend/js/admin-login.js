document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminLoginForm");
  const emailInput = document.getElementById("adminEmail");
  const passwordInput = document.getElementById("adminPassword");
  const submitBtn = document.getElementById("adminLoginSubmitBtn");

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

  function clearAdminSession() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("adminInfo");
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("adminInfo");
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput?.value.trim().toLowerCase() || "";
    const password = passwordInput?.value || "";

    if (!email || !password) {
      showToast("Please enter admin email and password.", "error");
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in...";

    try {
      clearUserSession();
      clearAdminSession();

      const response = await window.API.post("/admin/login", {
        email,
        password,
      });

      if (!response?.token || !response?.admin) {
        throw new Error("Admin login response was incomplete.");
      }

      localStorage.setItem("admin_token", response.token);
      localStorage.setItem("adminInfo", JSON.stringify(response.admin));

      showToast(response.message || "Admin login successful.", "success");

      setTimeout(() => {
        window.location.href = getPageUrl("admin-dashboard.html");
      }, 1000);
    } catch (error) {
      showToast(error.message || "Unable to log in as admin.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});