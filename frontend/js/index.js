document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");

  const openTermsModalBtn = document.getElementById("openTermsModal");
  const closeTermsModalBtn = document.getElementById("closeTermsModal");
  const termsModal = document.getElementById("termsModal");

  const openPolicyModalBtn = document.getElementById("openPolicyModal");
  const closePolicyModalBtn = document.getElementById("closePolicyModal");
  const policyModal = document.getElementById("policyModal");

  const revealItems = document.querySelectorAll(
    ".reveal, .reveal-left, .reveal-right"
  );

  const statRows = document.querySelectorAll(".stats-stack .stat-row");
  let activeIndex = 0;
  let statsInterval = null;

  function openMobileMenu() {
    if (!mobileNav) return;

    mobileNav.classList.remove("invisible", "opacity-0", "-translate-y-full");
    mobileNav.classList.add("visible", "opacity-100", "translate-y-0");
    document.body.classList.add("mobile-menu-open");
  }

  function closeMobileMenu() {
    if (!mobileNav) return;

    mobileNav.classList.remove("visible", "opacity-100", "translate-y-0");
    mobileNav.classList.add("invisible", "opacity-0", "-translate-y-full");
    document.body.classList.remove("mobile-menu-open");
  }

  function toggleMobileMenu() {
    if (!mobileNav) return;

    const isOpen = mobileNav.classList.contains("visible");
    if (isOpen) {
      closeMobileMenu();
    } else {
      closeMobileMenuFromModals();
      openMobileMenu();
    }
  }

  function openModal(modal) {
    if (!modal) return;

    closeMobileMenu();
    closeMobileMenuFromModals();
    modal.classList.add("active");
    document.body.classList.add("modal-open");
  }

  function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove("active");

    const hasAnyOpenModal =
      termsModal?.classList.contains("active") ||
      policyModal?.classList.contains("active");

    if (!hasAnyOpenModal) {
      document.body.classList.remove("modal-open");
    }
  }

  function closeMobileMenuFromModals() {
    closeModal(termsModal);
    closeModal(policyModal);
  }

  function rotateSingleStats() {
    if (!statRows.length) return;

    statRows.forEach((row) => {
      row.classList.remove("active", "mid");
    });

    statRows[activeIndex].classList.add("active");
    statRows[(activeIndex + 1) % statRows.length].classList.add("mid");

    activeIndex = (activeIndex + 1) % statRows.length;
  }

  function startStatsRotation() {
    if (!statRows.length) return;

    rotateSingleStats();

    if (statsInterval) {
      clearInterval(statsInterval);
    }

    statsInterval = setInterval(rotateSingleStats, 1800);
  }

  function setupRevealObserver() {
    if (!revealItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  menuToggle?.addEventListener("click", toggleMobileMenu);

  mobileNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileMenu();
    });
  });

  openTermsModalBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    openModal(termsModal);
  });

  closeTermsModalBtn?.addEventListener("click", () => {
    closeModal(termsModal);
  });

  termsModal?.addEventListener("click", (event) => {
    if (event.target === termsModal) {
      closeModal(termsModal);
    }
  });

  openPolicyModalBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    openModal(policyModal);
  });

  closePolicyModalBtn?.addEventListener("click", () => {
    closeModal(policyModal);
  });

  policyModal?.addEventListener("click", (event) => {
    if (event.target === policyModal) {
      closeModal(policyModal);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
      closeModal(termsModal);
      closeModal(policyModal);
    }
  });

  startStatsRotation();
  setupRevealObserver();

  if (window.lucide) {
    window.lucide.createIcons();
  }
});