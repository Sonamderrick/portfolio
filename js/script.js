(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Theme toggle
  const themeToggle = document.getElementById("themeToggle");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);

    if (!themeToggle) return;

    const isDark = theme === "dark";
    themeToggle.textContent = isDark ? "☀️" : "🌙";
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  let savedTheme = null;

  try {
    savedTheme = localStorage.getItem("theme");
  } catch {
    // The theme still works if browser storage is unavailable.
  }

  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

  themeToggle?.addEventListener("click", () => {
    const newTheme =
      root.getAttribute("data-theme") === "dark" ? "light" : "dark";

    applyTheme(newTheme);

    try {
      localStorage.setItem("theme", newTheme);
    } catch {
      // The selected theme remains active until the page is closed.
    }
  });

  // Mobile navigation
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  function closeMenu() {
    navLinks?.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open menu");

    if (menuToggle) {
      menuToggle.textContent = "☰";
    }
  }

  menuToggle?.addEventListener("click", () => {
    const isOpen = navLinks?.classList.toggle("open") ?? false;

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close menu" : "Open menu"
    );
    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  navLinks?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window
    .matchMedia("(min-width: 761px)")
    .addEventListener?.("change", (event) => {
      if (event.matches) {
        closeMenu();
      }
    });

  // Profile photo slideshow
  const carousel = document.getElementById("photoSlideshow");
  const slides = [...document.querySelectorAll("#photoSlides .slide")];
  const indicators = [
    ...document.querySelectorAll("#slideIndicators .slide-indicator"),
  ];
  const slideStatus = document.getElementById("slideStatus");

  let currentSlide = 0;
  let slideTimer = null;
  let slideshowPaused = false;

  function showSlide(index, announce = true) {
    if (slides.length === 0) return;

    currentSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === currentSlide;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    indicators.forEach((indicator, indicatorIndex) => {
      const isActive = indicatorIndex === currentSlide;
      indicator.classList.toggle("is-active", isActive);

      if (isActive) {
        indicator.setAttribute("aria-current", "true");
      } else {
        indicator.removeAttribute("aria-current");
      }
    });

    if (announce && slideStatus) {
      slideStatus.textContent = `Photo ${currentSlide + 1} of ${slides.length}`;
    }
  }

  function stopSlideshow() {
    window.clearInterval(slideTimer);
    slideTimer = null;
  }

  function startSlideshow() {
    stopSlideshow();

    if (
      reduceMotion ||
      slideshowPaused ||
      slides.length < 2 ||
      document.hidden
    ) {
      return;
    }

    slideTimer = window.setInterval(() => {
      showSlide(currentSlide + 1, false);
    }, 2500);
  }

  document.getElementById("slidePrev")?.addEventListener("click", () => {
    showSlide(currentSlide - 1);
    startSlideshow();
  });

  document.getElementById("slideNext")?.addEventListener("click", () => {
    showSlide(currentSlide + 1);
    startSlideshow();
  });

  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      showSlide(index);
      startSlideshow();
    });
  });

  carousel?.addEventListener("mouseenter", () => {
    slideshowPaused = true;
    stopSlideshow();
  });

  carousel?.addEventListener("mouseleave", () => {
    slideshowPaused = false;
    startSlideshow();
  });

  carousel?.addEventListener("focusin", () => {
    slideshowPaused = true;
    stopSlideshow();
  });

  carousel?.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) {
      slideshowPaused = false;
      startSlideshow();
    }
  });

  carousel?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showSlide(currentSlide - 1);
      startSlideshow();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showSlide(currentSlide + 1);
      startSlideshow();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  });

  showSlide(0, false);
  startSlideshow();

  // Animated network background
  const canvas = document.getElementById("networkCanvas");
  const context = canvas?.getContext("2d");

  if (canvas && context) {
    const LINK_DISTANCE = 140;

    let width = 0;
    let height = 0;
    let nodes = [];
    let packets = [];
    let ripples = [];
    let animationId = 0;
    let lastPacketTime = 0;

    function getAccentColor() {
      return (
        getComputedStyle(root).getPropertyValue("--primary").trim() ||
        "#2563eb"
      );
    }

    function createNode() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 1.5 + Math.random() * 1.5,
      };
    }

    function resizeCanvas() {
      const previousWidth = width;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      if (nodes.length === 0 || width !== previousWidth) {
        const nodeCount = Math.min(
          70,
          Math.floor((width * height) / 20000)
        );

        nodes = Array.from({ length: nodeCount }, createNode);
      }

      if (reduceMotion) {
        drawFrame();
      }
    }

    function drawFrame() {
      context.clearRect(0, 0, width, height);
      context.fillStyle = getAccentColor();
      context.strokeStyle = getAccentColor();
      context.lineWidth = 1;

      // Draw lines between nearby nodes.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.hypot(dx, dy);

          if (distance < LINK_DISTANCE) {
            context.globalAlpha =
              (1 - distance / LINK_DISTANCE) * 0.25;

            context.beginPath();
            context.moveTo(nodes[i].x, nodes[i].y);
            context.lineTo(nodes[j].x, nodes[j].y);
            context.stroke();
          }
        }
      }

      // Draw nodes.
      context.globalAlpha = 0.5;

      nodes.forEach((node) => {
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fill();
      });

      // Draw moving data packets.
      context.globalAlpha = 0.9;

      packets.forEach((packet) => {
        const x =
          packet.from.x +
          (packet.to.x - packet.from.x) * packet.progress;
        const y =
          packet.from.y +
          (packet.to.y - packet.from.y) * packet.progress;

        context.beginPath();
        context.arc(x, y, 3, 0, Math.PI * 2);
        context.fill();
      });

      // Draw pointer ripples.
      ripples.forEach((ripple) => {
        context.globalAlpha = ripple.alpha;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        context.stroke();
      });

      context.globalAlpha = 1;
    }

    function updateScene() {
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      });

      packets = packets.filter((packet) => {
        packet.progress += 0.02;

        const distance = Math.hypot(
          packet.from.x - packet.to.x,
          packet.from.y - packet.to.y
        );

        return packet.progress < 1 && distance < LINK_DISTANCE;
      });

      ripples = ripples.filter((ripple) => {
        ripple.radius += 3;
        ripple.alpha -= 0.02;
        return ripple.alpha > 0;
      });
    }

    function createPacket() {
      if (nodes.length < 2 || packets.length > 6) return;

      const from = nodes[Math.floor(Math.random() * nodes.length)];

      const nearbyNodes = nodes.filter((node) => {
        return (
          node !== from &&
          Math.hypot(from.x - node.x, from.y - node.y) < LINK_DISTANCE
        );
      });

      if (nearbyNodes.length > 0) {
        const to =
          nearbyNodes[Math.floor(Math.random() * nearbyNodes.length)];

        packets.push({ from, to, progress: 0 });
      }
    }

    function animate(time) {
      updateScene();

      if (time - lastPacketTime > 900) {
        createPacket();
        lastPacketTime = time;
      }

      drawFrame();
      animationId = window.requestAnimationFrame(animate);
    }

    window.addEventListener("pointerdown", (event) => {
      if (reduceMotion) return;

      ripples.push({
        x: event.clientX,
        y: event.clientY,
        radius: 0,
        alpha: 0.6,
      });

      nodes.forEach((node) => {
        const dx = node.x - event.clientX;
        const dy = node.y - event.clientY;
        const distance = Math.hypot(dx, dy);

        if (distance < 150 && distance > 0) {
          node.vx += (dx / distance) * 1.2;
          node.vy += (dy / distance) * 1.2;
        }
      });
    });

    // Gradually slow nodes after a pointer interaction.
    window.setInterval(() => {
      nodes.forEach((node) => {
        node.vx *= 0.9;
        node.vy *= 0.9;

        if (Math.abs(node.vx) < 0.1) {
          node.vx = (Math.random() - 0.5) * 0.4;
        }

        if (Math.abs(node.vy) < 0.1) {
          node.vy = (Math.random() - 0.5) * 0.4;
        }
      });
    }, 500);

    new MutationObserver(() => {
      if (reduceMotion) {
        drawFrame();
      }
    }).observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    function pauseAnimation() {
      window.cancelAnimationFrame(animationId);
      animationId = 0;
    }

    function resumeAnimation() {
      if (!reduceMotion && !document.hidden && animationId === 0) {
        animationId = window.requestAnimationFrame(animate);
      }
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        pauseAnimation();
      } else {
        resumeAnimation();
      }
    });

    window.addEventListener("resize", resizeCanvas);

    resizeCanvas();

    if (!reduceMotion) {
      resumeAnimation();
    }
  }

  // Reveal content as it scrolls into view.
  const revealTargets = document.querySelectorAll(
    ".section-title, .about-content, .skill-card, .project-card, " +
      ".timeline-item, .cert-card, .subsection-title, .contact-intro, .contact-list"
  );

  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealTargets.forEach((element, index) => {
      element.classList.add("reveal");
      element.style.setProperty("--delay", `${(index % 3) * 0.12}s`);
      revealObserver.observe(element);
    });
  }

  // Typing effect for the hero roles.
  const typedText = document.getElementById("typedText");
  const roles = [
    "Network Engineering",
    "System Administration",
    "Cybersecurity",
  ];

  let roleIndex = 0;
  let characterIndex = 0;
  let deleting = false;
  let typingTimer = null;

  function typeRole() {
    if (!typedText || document.hidden) return;

    const currentRole = roles[roleIndex];
    characterIndex += deleting ? -1 : 1;
    typedText.textContent = currentRole.substring(0, characterIndex);

    let delay = deleting ? 40 : 90;

    if (!deleting && characterIndex === currentRole.length) {
      delay = 1600;
      deleting = true;
    } else if (deleting && characterIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 400;
    }

    typingTimer = window.setTimeout(typeRole, delay);
  }

  if (typedText && !reduceMotion) {
    typedText.textContent = "";
    typeRole();
  }

  document.addEventListener("visibilitychange", () => {
    window.clearTimeout(typingTimer);

    if (!document.hidden && typedText && !reduceMotion) {
      typeRole();
    }
  });

  // Highlight the navigation link for the visible section.
  const pageSections = document.querySelectorAll("main section[id]");
  const navAnchors = document.querySelectorAll(".nav-links a");

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          navAnchors.forEach((link) => {
            const isCurrent = link.hash === `#${entry.target.id}`;
            link.classList.toggle("active", isCurrent);
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );

    pageSections.forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  // Back-to-top button
  const backToTop = document.getElementById("backToTop");

  function updateBackToTop() {
    backToTop?.classList.toggle("visible", window.scrollY > 450);
  }

  window.addEventListener("scroll", updateBackToTop, { passive: true });
  updateBackToTop();

  backToTop?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  });
})();