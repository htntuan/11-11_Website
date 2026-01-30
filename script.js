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
  initSolutionBackgrounds(); // Add mosaic backgrounds to solution cards
  initVideoPlayer(); // Initialize video player
  initStatIconAnimation(); // Initialize stat icon jump animation
});

/**
 * Initialize stat icon jump animation on scroll
 */
function initStatIconAnimation() {
  const icons = document.querySelectorAll(".stat-icon");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add animation class
          entry.target.classList.add("animate-jump");

          // Remove class after animation finishes (0.8s as defined in CSS)
          setTimeout(() => {
            entry.target.classList.remove("animate-jump");
          }, 1000);

          // Stop observing after animation is triggered
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.5, // Trigger when 50% of icon is visible
    }
  );

  icons.forEach((icon) => observer.observe(icon));
}

/**
 * Add background layer to each solution card for mosaic effect
 */
function initSolutionBackgrounds() {
  const solutionCards = document.querySelectorAll('.solution-card');

  solutionCards.forEach((card) => {
    // Create background layer element
    const bgLayer = document.createElement('div');
    bgLayer.className = 'solution-bg-layer';
    // Insert as first child so it's behind other content
    card.insertBefore(bgLayer, card.firstChild);
  });
}

/**
 * Video player functionality
 */
function initVideoPlayer() {
  const placeholder = document.getElementById('videoPlaceholder');
  const video = document.getElementById('productVideo');

  if (placeholder && video) {
    placeholder.addEventListener('click', () => {
      placeholder.classList.add('hidden');
      video.play();
    });

    // Show placeholder again when video ends
    video.addEventListener('ended', () => {
      placeholder.classList.remove('hidden');
    });

    // Show placeholder when video is paused and reset to beginning
    video.addEventListener('pause', () => {
      if (video.currentTime === 0) {
        placeholder.classList.remove('hidden');
      }
    });
  }
}

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
  const typingSpeed = 40; // Faster typing (was 80ms)

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
  const hamburgerIcon = hamburger?.querySelector(".material-symbols-outlined");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      hamburger.classList.toggle("active");

      // Toggle icon between menu and close
      if (hamburgerIcon) {
        hamburgerIcon.textContent = navLinks.classList.contains("active") ? "close" : "menu";
      }
    });

    // Close menu on link click
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        hamburger.classList.remove("active");
        if (hamburgerIcon) {
          hamburgerIcon.textContent = "menu";
        }
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
 * Scroll reveal animation - Enhanced version
 */
function initScrollReveal() {
  // Add scroll-reveal class to elements that should animate
  const animationConfig = [
    // Stats section
    { selector: '.stat-card', animation: 'fade-up', stagger: 100 },
    // About section
    { selector: '.about-intro', animation: 'fade-right', stagger: 0 },
    { selector: '.about-mission', animation: 'fade-up', stagger: 0 },
    { selector: '.feature-item', animation: 'fade-left', stagger: 80 },
    { selector: '.visual-card', animation: 'fade-left', stagger: 150 },
    // Philosophy section
    { selector: '.principle-card', animation: 'fade-up', stagger: 100 },
    // Solutions section
    { selector: '.solution-filter', animation: 'fade-up', stagger: 0 },
    { selector: '.solution-card', animation: 'zoom-in', stagger: 50 },
    // Quote section
    { selector: '.quote-content', animation: 'fade-up', stagger: 0 },
    // CTA section
    { selector: '.cta-content h2', animation: 'fade-up', stagger: 0 },
    { selector: '.cta-content > p', animation: 'fade-up', stagger: 0 },
    { selector: '.cta-value', animation: 'fade-up', stagger: 150 },
    // Section headers
    { selector: '.section-tag', animation: 'fade-down', stagger: 0 },
    { selector: '.section-title', animation: 'fade-up', stagger: 0 },
    { selector: '.section-subtitle', animation: 'fade-up', stagger: 0 },
  ];

  // Apply initial hidden state and set up observer
  animationConfig.forEach(config => {
    const elements = document.querySelectorAll(config.selector);
    elements.forEach((el, index) => {
      el.classList.add('scroll-reveal', config.animation);
      el.style.transitionDelay = `${index * config.stagger}ms`;
    });
  });

  // Create intersection observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Optional: unobserve after animation for performance
          // observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  );

  // Observe all scroll-reveal elements
  document.querySelectorAll('.scroll-reveal').forEach(el => {
    observer.observe(el);
  });
}

// Initialize scroll reveal after DOM is fully loaded
window.addEventListener("load", () => {
  initScrollReveal();
});
