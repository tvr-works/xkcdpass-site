document.documentElement.classList.add("has-enhanced-nav");

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", async () => {
    const targetId = button.getAttribute("data-copy-target");
    const target = targetId ? document.getElementById(targetId) : null;

    if (!target) {
      return;
    }

    try {
      const value = target.textContent.trim();
      const originalLabel =
        button.getAttribute("aria-label") || button.getAttribute("title") || "Copy";

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }

      button.classList.add("is-copied");
      button.setAttribute("aria-label", "Copied");
      button.setAttribute("title", "Copied");

      window.setTimeout(() => {
        button.classList.remove("is-copied");
        button.setAttribute("aria-label", originalLabel);
        button.setAttribute("title", originalLabel);
      }, 1600);
    } catch {
      button.setAttribute("aria-label", "Copy failed");
      button.setAttribute("title", "Copy failed");
    }
  });
});

document.querySelectorAll(".faq-item").forEach((item) => {
  const question = item.querySelector(".faq-question");
  const answer = item.querySelector(".faq-answer");

  if (!question || !answer) {
    return;
  }

  if (answer.id) {
    question.setAttribute("aria-controls", answer.id);
  }

  question.addEventListener("click", () => {
    const isExpanded = question.getAttribute("aria-expanded") === "true";
    question.setAttribute("aria-expanded", String(!isExpanded));
    answer.hidden = isExpanded;
  });
});
