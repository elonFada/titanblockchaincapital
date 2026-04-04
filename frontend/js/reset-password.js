document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetPasswordForm");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
  const submitBtn = document.getElementById("resetPasswordSubmitBtn");

  function getPageUrl(page) {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    return isLocal ? `/frontend/${page}` : `/${page}`;
  }

  function getResetState() {
    return {
      email: sessionStorage.getItem("resetPasswordEmail") || "",
      resetSessionToken: sessionStorage.getItem("resetPasswordSessionToken") || "",
    };
  }

  function clearResetState() {
    sessionStorage.removeItem("resetPasswordEmail");
    sessionStorage.removeItem("resetPasswordToken");
    sessionStorage.removeItem("resetPasswordSessionToken");
  }

  const { email, resetSessionToken } = getResetState();
  if (!email || !resetSessionToken) {
    window.location.href = getPageUrl("forgot-password.html");
    return;
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const newPassword = newPasswordInput?.value || "";
    const confirmNewPassword = confirmNewPasswordInput?.value || "";

    if (!newPassword || !confirmNewPassword) {
      showToast("Please fill in both password fields.", "error");
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Resetting...";

    try {
      const response = await window.API.post("/user/reset-password", {
        email,
        resetSessionToken,
        newPassword,
        confirmNewPassword,
      });

      clearResetState();

      showToast(
        response?.message || "Password reset successfully.",
        "success"
      );

      setTimeout(() => {
        window.location.href = getPageUrl("login.html");
      }, 1200);
    } catch (error) {
      showToast(error.message || "Failed to reset password.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});