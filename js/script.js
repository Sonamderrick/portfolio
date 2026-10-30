// ========== THEME TOGGLE ==========
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement; // the <html> element

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  if (theme === "dark") {
    themeToggle.textContent = "☀️";
    themeToggle.setAttribute("aria-label", "Switch to light theme");
  } else {
    themeToggle.textContent = "🌙";
    themeToggle.setAttribute("aria-label", "Switch to dark theme");
  }
}

// On page load: use the saved choice, otherwise the computer's own setting
const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

// On click: flip the theme and save it
themeToggle.addEventListener("click", function () {
  const newTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(newTheme);
  localStorage.setItem("theme", newTheme);
});

// ========== MOBILE MENU ==========
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

function closeMenu() {
  navLinks.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open menu");
  menuToggle.textContent = "☰";
}

menuToggle.addEventListener("click", function () {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  menuToggle.textContent = isOpen ? "✕" : "☰";
});

// Close the menu after the visitor taps a link
navLinks.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", closeMenu);
});

// Close the menu with the Escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeMenu();
  }
});

// ========== ANIMATED NETWORK BACKGROUND ==========
const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const LINK_DISTANCE = 140; // max distance (px) for two nodes to connect
let width = 0;
let height = 0;
let nodes = [];
let packets = [];
let ripples = [];
let accent = "#2563eb";
let animationId = null;

// Read the current accent colour from the CSS variable (changes with theme)
function readAccent() {
  accent = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary").trim() || "#2563eb";
}

function createNode() {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: 1.5 + Math.random() * 1.5
  };
}

function resizeCanvas() {
  const oldWidth = width;
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  // Only rebuild the nodes if the width changed (avoids jumps on phones)
  if (nodes.length === 0 || width !== oldWidth) {
    const count = Math.min(70, Math.floor((width * height) / 20000));
    nodes = [];
    for (let i = 0; i < count; i++) {
      nodes.push(createNode());
    }
  }
  if (reduceMotion) {
    drawFrame();
  }
}

function drawFrame() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = accent;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;

  // Links between nearby nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < LINK_DISTANCE) {
        ctx.globalAlpha = (1 - distance / LINK_DISTANCE) * 0.25;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }

  // Nodes
  ctx.globalAlpha = 0.5;
  nodes.forEach(function (node) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Data packets travelling along links
  ctx.globalAlpha = 0.9;
  packets.forEach(function (packet) {
    const x = packet.from.x + (packet.to.x - packet.from.x) * packet.progress;
    const y = packet.from.y + (packet.to.y - packet.from.y) * packet.progress;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Click ripples
  ripples.forEach(function (ripple) {
    ctx.globalAlpha = ripple.alpha;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

function updateScene() {
  // Move nodes and bounce them off the screen edges
  nodes.forEach(function (node) {
    node.x += node.vx;
    node.y += node.vy;
    if (node.x < 0 || node.x > width) node.vx *= -1;
    if (node.y < 0 || node.y > height) node.vy *= -1;
  });

  // Move packets; remove finished ones or ones whose link has stretched too far
  packets = packets.filter(function (packet) {
    packet.progress += 0.02;
    const dx = packet.from.x - packet.to.x;
    const dy = packet.from.y - packet.to.y;
    return packet.progress < 1 && Math.sqrt(dx * dx + dy * dy) < LINK_DISTANCE;
  });

  // Expand and fade ripples
  ripples = ripples.filter(function (ripple) {
    ripple.radius += 3;
    ripple.alpha -= 0.02;
    return ripple.alpha > 0;
  });
}

// Every so often, send a new packet between two connected nodes
function spawnPacket() {
  if (nodes.length < 2 || packets.length > 6) return;
  const from = nodes[Math.floor(Math.random() * nodes.length)];
  const nearby = nodes.filter(function (other) {
    const dx = from.x - other.x;
    const dy = from.y - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return other !== from && distance < LINK_DISTANCE;
  });
  if (nearby.length > 0) {
    const to = nearby[Math.floor(Math.random() * nearby.length)];
    packets.push({ from: from, to: to, progress: 0 });
  }
}

function animate() {
  updateScene();
  drawFrame();
  animationId = requestAnimationFrame(animate);
}

// Click or tap: ripple + push nearby nodes away
window.addEventListener("pointerdown", function (event) {
  if (reduceMotion) return;
  ripples.push({ x: event.clientX, y: event.clientY, radius: 0, alpha: 0.6 });
  nodes.forEach(function (node) {
    const dx = node.x - event.clientX;
    const dy = node.y - event.clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 150 && distance > 0) {
      node.vx += (dx / distance) * 1.2;
      node.vy += (dy / distance) * 1.2;
    }
  });
});

// Slow nodes back down after a push so they don't fly around forever
setInterval(function () {
  nodes.forEach(function (node) {
    node.vx *= 0.9;
    node.vy *= 0.9;
    if (Math.abs(node.vx) < 0.1) node.vx = (Math.random() - 0.5) * 0.4;
    if (Math.abs(node.vy) < 0.1) node.vy = (Math.random() - 0.5) * 0.4;
  });
}, 500);

// Start / stop
if (!reduceMotion) {
  setInterval(spawnPacket, 900);
}

// Update the colour when the theme changes
new MutationObserver(function () {
  readAccent();
  if (reduceMotion) drawFrame();
}).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

// Pause the animation when the tab is hidden (saves battery)
document.addEventListener("visibilitychange", function () {
  if (reduceMotion) return;
  if (document.hidden) {
    cancelAnimationFrame(animationId);
  } else {
    animationId = requestAnimationFrame(animate);
  }
});

window.addEventListener("resize", resizeCanvas);

readAccent();
resizeCanvas();
if (!reduceMotion) {
  animate();
}

// ========== SCROLL REVEAL ==========
const revealTargets = document.querySelectorAll(
  ".section-title, .about-content, .skill-card, .project-card, " +
  ".timeline-item, .cert-card, .subsection-title, .contact-intro, .contact-list"
);

if ("IntersectionObserver" in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target); // animate only once
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(function (element, index) {
    element.classList.add("reveal");
    // Stagger neighbouring cards slightly
    element.style.setProperty("--delay", (index % 3) * 0.12 + "s");
    revealObserver.observe(element);
  });
}

// ========== TYPING EFFECT ==========
const typedText = document.getElementById("typedText");
const roles = ["Network Engineering", "System Administration", "Cybersecurity"];
let roleIndex = 0;
let charIndex = 0;
let deleting = false;

function typeRole() {
  const current = roles[roleIndex];

  if (deleting) {
    charIndex--;
  } else {
    charIndex++;
  }
  typedText.textContent = current.substring(0, charIndex);

  let delay = deleting ? 40 : 90;

  if (!deleting && charIndex === current.length) {
    delay = 1600;           // pause when the word is complete
    deleting = true;
  } else if (deleting && charIndex === 0) {
    deleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
    delay = 400;            // short pause before the next word
  }

  setTimeout(typeRole, delay);
}

// Only animate if the visitor has not asked for reduced motion
if (typedText && !reduceMotion) {
  typedText.textContent = "";
  typeRole();
}

// ========== ACTIVE NAV LINK ==========
const pageSections = document.querySelectorAll("main section[id]");
const navAnchors = document.querySelectorAll(".nav-links a");

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        navAnchors.forEach(function (link) {
          const isCurrent = link.getAttribute("href") === "#" + entry.target.id;
          link.classList.toggle("active", isCurrent);
          if (isCurrent) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" }); // a section counts when it crosses the middle of the screen

  pageSections.forEach(function (section) {
    sectionObserver.observe(section);
  });
}

// ========== BACK-TO-TOP BUTTON ==========
const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", function () {
  backToTop.classList.toggle("show", window.scrollY > 500);
});

backToTop.addEventListener("click", function () {
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
});