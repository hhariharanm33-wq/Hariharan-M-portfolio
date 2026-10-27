"use strict";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const currentYear = $("#currentYear");
if (currentYear) currentYear.textContent = new Date().getFullYear();


// Type code into the laptop screen, then reveal the program output.
const typingCode = $("#typingCode");
const typingOutput = $("#typingOutput");
const typingStatus = $("#typingStatus");
if (typingCode && typingOutput && typingStatus) {
  const demoLines = [
    "public class Developer {",
    "  public static void main(String[] args) {",
    '    String name = "Hariharan";',
    '    String skill = "Java + Full Stack";',
    `    System.out.println("I am, " + name);`,
    "    System.out.println(skill);",
    "  }",
    "}"
  ];
  const codeText = demoLines.join("\n");
  let charIndex = 0;
  let outputShown = false;
  const typeNextCharacter = () => {
    if (charIndex < codeText.length) {
      typingCode.textContent += codeText.charAt(charIndex++);
      window.setTimeout(typeNextCharacter, codeText.charAt(charIndex - 1) === "\n" ? 180 : 28);
      return;
    }
    if (!outputShown) {
      outputShown = true;
      typingStatus.textContent = "Program executed successfully";
      typingOutput.textContent = "I am, Hariharan  ·  Java + Full Stack";
    }
    window.setTimeout(() => {
      typingCode.textContent = "";
      typingOutput.textContent = "Waiting for program...";
      typingStatus.textContent = "Typing code...";
      charIndex = 0;
      outputShown = false;
      window.setTimeout(typeNextCharacter, 450);
    }, 4800);
  };
  window.setTimeout(typeNextCharacter, 700);
}


// Animate section content as it enters the viewport.
const revealItems = $$(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

// Reading progress bar and back-to-top control.
const progressBar = $("#scrollProgress");
const backToTop = $("#backToTop");

function updateScrollUI() {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
  if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  if (backToTop) backToTop.classList.toggle("visible", window.scrollY > 500);
}
window.addEventListener("scroll", updateScrollUI, { passive: true });
updateScrollUI();

if (backToTop) {
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// Close the mobile navigation after choosing a section.
$$(".navbar-nav .nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    const nav = $("#mainNav");
    if (nav && nav.classList.contains("show") && window.bootstrap) {
      window.bootstrap.Collapse.getOrCreateInstance(nav).hide();
    }
  });
});

// Filter project cards.
const filterButtons = $$(".filter-button");
const projectItems = $$(".project-item");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter || "all";

    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });

    projectItems.forEach((item) => {
      const matches = selectedFilter === "all" || item.dataset.category === selectedFilter;
      item.hidden = !matches;
    });
  });
});

// Submit the contact form to the Express API.
const contactForm = $("#contactForm");
const formStatus = $("#formStatus");
const submitButton = $("#submitButton");

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) return;

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());
    const originalButtonText = submitButton ? submitButton.innerHTML : "";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }
    if (formStatus) {
      formStatus.textContent = "";
      formStatus.classList.remove("error");
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to send your message.");
      }

      if (formStatus) formStatus.textContent = result.message;
      contactForm.reset();
    } catch (error) {
      if (formStatus) {
        formStatus.textContent = error.message || "Could not connect to the server. Please try again.";
        formStatus.classList.add("error");
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    }
  });
}
















(() => {
  const root = document.documentElement;
  const dot = document.querySelector(".site-cursor-dot");
  const ring = document.querySelector(".site-cursor-ring");

  if (!dot || !ring) return;

  const allowed = window.matchMedia(
    "(hover: hover) and (pointer: fine) and " +
    "(prefers-reduced-motion: no-preference)"
  );

  const interactiveSelector = [
    "a[href]",
    "button:not(:disabled)",
    '[role="button"]',
    "summary",
    'input[type="submit"]',
    'input[type="button"]'
  ].join(",");

  const nativeCursorSelector = [
    "input",
    "textarea",
    "select",
    '[contenteditable]:not([contenteditable="false"])',
    "iframe"
  ].join(",");

  let mouseX = 0;
  let mouseY = 0;
  let ringX = 0;
  let ringY = 0;
  let frame = null;
  let visible = false;

  function hideCursor() {
    visible = false;

    root.classList.remove(
      "site-cursor-active",
      "site-cursor-hover",
      "site-cursor-down"
    );

    cancelAnimationFrame(frame);
    frame = null;
  }

  function updateTarget(target) {
    if (
      !(target instanceof Element) ||
      target.closest(nativeCursorSelector)
    ) {
      hideCursor();
      return false;
    }

    root.classList.toggle(
      "site-cursor-hover",
      Boolean(target.closest(interactiveSelector))
    );

    return true;
  }

  function animate() {
    if (!visible) {
      frame = null;
      return;
    }

    ringX += (mouseX - ringX) * 0.2;
    ringY += (mouseY - ringY) * 0.2;

    ring.style.transform =
      `translate3d(${ringX}px, ${ringY}px, 0) ` +
      "translate(-50%, -50%)";

    frame = requestAnimationFrame(animate);
  }

  window.addEventListener("pointermove", (event) => {
    if (!allowed.matches || event.pointerType !== "mouse") {
      hideCursor();
      return;
    }

    mouseX = event.clientX;
    mouseY = event.clientY;

    if (!updateTarget(event.target)) return;

    dot.style.transform =
      `translate3d(${mouseX}px, ${mouseY}px, 0) ` +
      "translate(-50%, -50%)";

    if (!visible) {
      ringX = mouseX;
      ringY = mouseY;
      visible = true;
      root.classList.add("site-cursor-active");
    }

    if (frame === null) animate();
  }, { passive: true });

  /* Update hover state when scrolling beneath a stationary mouse */
  window.addEventListener("scroll", () => {
    if (!visible) return;

    updateTarget(document.elementFromPoint(mouseX, mouseY));
  }, { passive: true });

  window.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && visible) {
      root.classList.add("site-cursor-down");
    }
  });

  window.addEventListener("pointerup", () => {
    root.classList.remove("site-cursor-down");
  });

  document.documentElement.addEventListener(
    "pointerleave",
    hideCursor
  );

  window.addEventListener("blur", hideCursor);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hideCursor();
  });

  allowed.addEventListener("change", hideCursor);
})();
