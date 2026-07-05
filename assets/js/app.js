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

  const menuButton = document.querySelector("[data-menu-button]");
  const mobilePanel = document.querySelector("[data-mobile-panel]");
  if (menuButton && mobilePanel) {
    menuButton.addEventListener("click", () => {
      const open = mobilePanel.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
    });
  }

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
  if (revealNodes.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    revealNodes.forEach((node) => observer.observe(node));
  }

  const parallaxItems = document.querySelectorAll("[data-parallax]");
  const cards3d = document.querySelectorAll("[data-3d-card]");
  const stage3d = document.querySelector("[data-3d-stage]");

  function onScroll3d() {
    const y = window.scrollY;
    const vh = window.innerHeight;

    parallaxItems.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    });

    if (stage3d) {
      const rect = stage3d.getBoundingClientRect();
      const progress = Math.min(Math.max((vh - rect.top) / (vh + rect.height), 0), 1);
      stage3d.style.setProperty("--scroll-p", progress.toFixed(4));
    }

    cards3d.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const delta = (center - vh / 2) / vh;
      const rotateX = delta * -12;
      const rotateY = (index % 2 === 0 ? 1 : -1) * delta * 8;
      const translateZ = Math.max(0, 1 - Math.abs(delta)) * 40;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
    });
  }

  window.addEventListener("scroll", onScroll3d, { passive: true });
  window.addEventListener("resize", onScroll3d);
  onScroll3d();

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