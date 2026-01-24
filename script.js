/* ============================================
   GREEN TRUTH - JavaScript Interactions
   ============================================ */

document.addEventListener("DOMContentLoaded", function () {
  // Initialize all components
  initNavbar();
  initMobileMenu();
  initStatsCounter();
  initSolutionFilters();
  initSmoothScroll();
  initTypingEffect();
});

/**
 * Typing effect for hero badge
 */
function initTypingEffect() {
  const badge = document.querySelector('.hero-badge');
  if (!badge) return;

  const originalText = badge.textContent;
  badge.textContent = '';
  badge.style.minWidth = '280px';

  let charIndex = 0;
  const typingSpeed = 80;

  function typeChar() {
    if (charIndex < originalText.length) {
      badge.textContent += originalText.charAt(charIndex);
      charIndex++;
      setTimeout(typeChar, typingSpeed);
    }
  }

  // Start typing after a short delay
  setTimeout(typeChar, 500);
}

/**
 * Navbar scroll effect
 */
function initNavbar() {
  const navbar = document.getElementById("navbar");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
}

/**
 * Mobile menu toggle
 */
function initMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      hamburger.classList.toggle("active");
    });

    // Close menu on link click
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        hamburger.classList.remove("active");
      });
    });
  }
}

/**
 * Animated stats counter
 */
function initStatsCounter() {
  const stats = document.querySelectorAll(".stat-number");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const stat = entry.target;
          const target = parseInt(stat.getAttribute("data-count"));
          animateCounter(stat, target);
          observer.unobserve(stat);
        }
      });
    },
    { threshold: 0.5 },
  );

  stats.forEach((stat) => observer.observe(stat));
}

function animateCounter(element, target) {
  const duration = 2000;
  const steps = 60;
  const stepDuration = duration / steps;
  const increment = target / steps;
  let current = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, stepDuration);
}

/**
 * Solution cards toggle
 */
function toggleSolution(button) {
  const card = button.closest(".solution-card");
  const details = card.querySelector(".solution-details");

  button.classList.toggle("active");
  details.classList.toggle("show");

  // Update button text
  const span = button.querySelector("span");
  if (details.classList.contains("show")) {
    span.textContent = "Ẩn giải pháp";
  } else {
    span.textContent = "Xem giải pháp";
  }
}

/**
 * Solution category filters
 */
function initSolutionFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const solutionCards = document.querySelectorAll(".solution-card");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Update active button
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter");

      solutionCards.forEach((card) => {
        if (filter === "all" || card.getAttribute("data-category") === filter) {
          card.style.display = "block";
          card.style.animation = "fadeInUp 0.5s ease";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

/**
 * Smooth scroll for anchor links
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));

      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    });
  });
}

/**
 * Scroll reveal animation
 */
function initScrollReveal() {
  const elements = document.querySelectorAll(
    ".principle-card, .solution-card, .visual-card",
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1 },
  );

  elements.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "all 0.6s ease";
    observer.observe(el);
  });
}

// Initialize scroll reveal after DOM is fully loaded
window.addEventListener("load", initScrollReveal);
