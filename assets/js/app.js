(function () {
  const root = document.documentElement;
  const THEME_KEY = "shirinvent-theme";

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(theme === "dark"));
      btn.setAttribute("aria-label", theme === "dark" ? "Светлая тема" : "Тёмная тема");
    });
  }

  applyTheme(getPreferredTheme());

  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  });

  const topbar = document.querySelector(".topbar");
  const menuButton = document.querySelector("[data-menu-button]");
  const mobilePanel = document.querySelector("[data-mobile-panel]");

  function closeMobileMenu() {
    if (!mobilePanel || !menuButton) return;
    mobilePanel.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    topbar?.classList.remove("topbar--menu-open");
  }

  if (menuButton && mobilePanel) {
    menuButton.addEventListener("click", () => {
      const open = mobilePanel.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
      topbar?.classList.toggle("topbar--menu-open", open);
      if (open) topbar?.classList.remove("topbar--hidden");
      requestAnimationFrame(setHeaderHeight);
    });

    mobilePanel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });
  }

  function setHeaderHeight() {
    if (!topbar) return;
    const height = topbar.offsetHeight;
    root.style.setProperty("--header-height", `${height}px`);
  }

  setHeaderHeight();
  window.addEventListener("resize", setHeaderHeight);

  let lastScrollY = window.scrollY;
  let scrollTicking = false;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onScrollHeader() {
    if (!topbar) return;

    const y = window.scrollY;
    const menuOpen = mobilePanel?.classList.contains("open");

    if (y <= 24) {
      topbar.classList.remove("topbar--hidden", "topbar--compact");
    } else if (!menuOpen) {
      const delta = y - lastScrollY;
      if (delta > 6) {
        topbar.classList.add("topbar--hidden");
        topbar.classList.remove("topbar--compact");
      } else if (delta < -6) {
        topbar.classList.remove("topbar--hidden");
        topbar.classList.add("topbar--compact");
      }
    }

    lastScrollY = y;
    scrollTicking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(onScrollHeader);
      }
    },
    { passive: true }
  );

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const progress = document.querySelector(".scroll-progress");
  if (progress) {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      progress.style.transform = `scaleX(${ratio})`;
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  const revealNodes = document.querySelectorAll("[data-reveal]");
  if (revealNodes.length && !reducedMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
    );
    revealNodes.forEach((node) => observer.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add("visible"));
  }

  document.querySelectorAll("[data-lead-form]").forEach((form) => {
    const notice = form.querySelector("[data-form-notice]");
    const submitBtn = form.querySelector("[type=submit]");
    const lang = form.dataset.lang || "ru";
    const emailEndpoint = form.dataset.email || "https://formsubmit.co/ajax/taj_@mail.ru";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const payload = new FormData();
      payload.append("name", data.get("name") || "");
      payload.append("phone", data.get("phone") || "");
      payload.append("email", data.get("email") || "");
      payload.append("service", data.get("service") || "");
      payload.append("message", data.get("message") || "");
      payload.append(
        "_subject",
        lang === "tj" ? "Дархости нав аз сайти Shirinvent" : "Новая заявка с сайта Shirinvent"
      );
      payload.append("_template", "table");
      payload.append("_captcha", "false");

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.original = submitBtn.textContent;
        submitBtn.textContent = lang === "tj" ? "Ирсол..." : "Отправка...";
      }

      try {
        const res = await fetch(emailEndpoint, { method: "POST", body: payload });
        if (!res.ok) throw new Error("send failed");
        if (notice) {
          notice.textContent =
            lang === "tj"
              ? "Дархост фиристода шуд! Мо ба зудӣ тамос мегирем."
              : "Заявка отправлена на почту! Мы свяжемся с вами в ближайшее время.";
          notice.classList.add("success");
        }
        form.reset();
      } catch {
        if (notice) {
          notice.textContent =
            lang === "tj"
              ? "Хатогӣ. Лутфан дар WhatsApp нависед ё занг занед."
              : "Ошибка отправки. Напишите в WhatsApp или позвоните нам.";
          notice.classList.add("error");
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.original || submitBtn.textContent;
        }
      }
    });
  });
})();