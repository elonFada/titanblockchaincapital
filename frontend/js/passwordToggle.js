document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("passwordInput");
  const toggleBtn = document.getElementById("togglePassword");

  if (!passwordInput || !toggleBtn) return;

  let visible = false;

  toggleBtn.addEventListener("click", () => {
    visible = !visible;

    // toggle input type
    passwordInput.type = visible ? "text" : "password";

    // change icon
    toggleBtn.innerHTML = visible
      ? '<i data-lucide="eye-off" class="w-5 h-5"></i>'
      : '<i data-lucide="eye" class="w-5 h-5"></i>';

    // re-render lucide icon
    lucide.createIcons();
  });
});

// register
document.addEventListener("DOMContentLoaded", () => {
  const toggles = [
    {
      input: document.getElementById("registerPasswordInput"),
      button: document.getElementById("toggleRegisterPassword"),
    },
    {
      input: document.getElementById("registerConfirmPasswordInput"),
      button: document.getElementById("toggleRegisterConfirmPassword"),
    },
  ];

  toggles.forEach(({ input, button }) => {
    if (!input || !button) return;

    let visible = false;

    button.addEventListener("click", () => {
      visible = !visible;
      input.type = visible ? "text" : "password";

      button.innerHTML = visible
        ? '<i data-lucide="eye-off" class="w-5 h-5"></i>'
        : '<i data-lucide="eye" class="w-5 h-5"></i>';

      lucide.createIcons();
    });
  });
});