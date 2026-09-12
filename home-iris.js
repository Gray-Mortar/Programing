(function () {
  const card = document.querySelector("#iris-intro-card");
  const iris = card?.querySelector(".home-iris");
  const messages = Array.from(
    card?.querySelectorAll("[data-iris-message]") || [],
  );
  const step = card?.querySelector("#iris-intro-step");

  if (!card || !iris || !messages.length) return;

  let animationFrame = 0;
  let currentMessage = 0;

  function resetPose() {
    iris.style.setProperty("--iris-shift-x", "0px");
    iris.style.setProperty("--iris-shift-y", "0px");
    iris.style.setProperty("--iris-tilt", "0deg");
  }

  card.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(() => {
      const bounds = card.getBoundingClientRect();
      const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
      const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;

      iris.style.setProperty("--iris-shift-x", `${horizontal * 10}px`);
      iris.style.setProperty("--iris-shift-y", `${vertical * 4}px`);
      iris.style.setProperty("--iris-tilt", `${horizontal * 3}deg`);
    });
  });

  card.addEventListener("pointerleave", resetPose);
  card.addEventListener("pointercancel", resetPose);

  function showMessage(index) {
    currentMessage = (index + messages.length) % messages.length;
    iris.toggleAttribute("standing", currentMessage > 0);
    messages.forEach((message, messageIndex) => {
      const isCurrent = messageIndex === currentMessage;
      message.hidden = !isCurrent;
      message.classList.toggle("is-current", isCurrent);
    });
    if (step) step.textContent = String(currentMessage + 1);
    card.setAttribute(
      "aria-label",
      `Iris 自我介绍，第 ${currentMessage + 1} 段，共 ${messages.length} 段。点击查看下一段。`,
    );
  }

  function advanceMessage() {
    showMessage(currentMessage + 1);
  }

  card.addEventListener("click", (event) => {
    if (event.target.closest("a, button, input, select, textarea")) return;
    advanceMessage();
  });

  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    advanceMessage();
  });

  showMessage(0);
})();
