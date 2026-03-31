document.addEventListener("DOMContentLoaded", () => {
  const otpForm = document.getElementById("otpForm");
  const verifyBtn = document.getElementById("verifyBtn");
  const resendBtn = document.getElementById("resendOtpBtn");
  const maskedEmailEl = document.getElementById("maskedEmail");
  const countdownText = document.getElementById("countdownText");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");
  const inputs = Array.from(document.querySelectorAll(".digit-input"));

  let intervalId; // ✅ MUST be declared before startTimer is called

  let email = sessionStorage.getItem("pendingVerificationEmail") || "";
  let verificationToken =
    sessionStorage.getItem("pendingVerificationToken") || "";

  if (!email || !verificationToken) {
    showToast("Verification session expired. Please register again.", "error");
    setTimeout(() => {
      window.location.href = "register.html";
    }, 1200);
    return;
  }

  if (maskedEmailEl) {
    maskedEmailEl.textContent = maskEmail(email);
  }

  setupOtpInputs(inputs);
  startTimer(15 * 60);

  otpForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages();

    const emailOTP = inputs.map((input) => input.value.trim()).join("");

    if (emailOTP.length !== 6) {
      showInlineError("Please enter the complete 6-digit code.");
      shakeContainer();
      return;
    }

    const originalText = verifyBtn.textContent;
    verifyBtn.disabled = true;
    verifyBtn.textContent = "Verifying...";

    try {
      const res = await window.API.post("/user/verify", {
        email,
        emailOTP,
        verificationToken,
      });

      if (res?.session?.token) {
        localStorage.setItem("token", res.session.token);
      }

      if (res?.user) {
        localStorage.setItem("userInfo", JSON.stringify(res.user));
      }

      sessionStorage.removeItem("pendingVerificationToken");

      showInlineSuccess(res.message || "Verification successful.");
      showToast("Account verified successfully.", "success");

      setTimeout(() => {
        window.location.href = "registration-fee.html";
      }, 1000);
    } catch (error) {
      showInlineError(error.message || "Verification failed.");
      showToast(error.message || "Verification failed.", "error");
      shakeContainer();
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.textContent = originalText;
    }
  });

  resendBtn?.addEventListener("click", async () => {
    clearMessages();

    const originalHtml = resendBtn.innerHTML;
    resendBtn.disabled = true;
    resendBtn.innerHTML = "Sending...";

    try {
      const res = await window.API.post("/user/resend-verification", { email });

      if (res?.verificationToken) {
        verificationToken = res.verificationToken;
        sessionStorage.setItem("pendingVerificationToken", verificationToken);
      }

      inputs.forEach((input) => (input.value = ""));
      inputs[0]?.focus();

      showInlineSuccess(
        res.message || "A new verification code has been sent."
      );
      showToast("A new verification code has been sent.", "success");
      startTimer(15 * 60);
    } catch (error) {
      showInlineError(error.message || "Unable to resend verification code.");
      showToast(
        error.message || "Unable to resend verification code.",
        "error"
      );
    } finally {
      resendBtn.disabled = false;
      resendBtn.innerHTML = originalHtml;
    }
  });

  function setupOtpInputs(fields) {
    fields.forEach((input, index) => {
      input.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 1);
        if (e.target.value && index < fields.length - 1) {
          fields[index + 1].focus();
        }
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && index > 0) {
          fields[index - 1].focus();
        }
      });

      input.addEventListener("paste", (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData.getData("text") || "")
          .replace(/\D/g, "")
          .slice(0, 6);

        pasted.split("").forEach((char, i) => {
          if (fields[i]) fields[i].value = char;
        });

        const targetIndex = Math.min(pasted.length, fields.length - 1);
        fields[targetIndex]?.focus();
      });
    });
  }

  function clearMessages() {
    if (errorMessage) {
      errorMessage.classList.add("hidden");
      errorMessage.textContent = "";
    }
    if (successMessage) {
      successMessage.classList.add("hidden");
      successMessage.textContent = "";
    }
  }

  function showInlineError(message) {
    if (!errorMessage) return;
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
  }

  function showInlineSuccess(message) {
    if (!successMessage) return;
    successMessage.textContent = message;
    successMessage.classList.remove("hidden");
  }

  function shakeContainer() {
    const container = document.getElementById("otpContainer");
    if (!container) return;
    container.classList.remove("fade-shake");
    void container.offsetWidth;
    container.classList.add("fade-shake");
  }

  function maskEmail(value) {
    const [name, domain] = value.split("@");
    if (!name || !domain) return value;
    const first = name.slice(0, 2);
    const last = name.length > 2 ? name.slice(-1) : "";
    const middle = "*".repeat(Math.max(2, name.length - 3));
    return `${first}${middle}${last}@${domain}`;
  }

  function startTimer(totalSeconds) {
    clearInterval(intervalId);
    let remaining = totalSeconds;

    const tick = () => {
      if (remaining < 0) {
        clearInterval(intervalId);
        if (countdownText) countdownText.textContent = "Expired";
        return;
      }

      const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
      const secs = String(remaining % 60).padStart(2, "0");
      if (countdownText) countdownText.textContent = `${mins}:${secs}`;
      remaining -= 1;
    };

    tick();
    intervalId = setInterval(tick, 1000);
  }
});