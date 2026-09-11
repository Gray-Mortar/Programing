(function () {
  const cards = Array.from(document.querySelectorAll(".course-choice-card"));

  function setActiveCard(activeCard) {
    cards.forEach((card) => {
      const isActive = card === activeCard;
      card.classList.toggle("is-iris-active", isActive);
      card.querySelector("iris-peek")?.toggleAttribute("active", isActive);
    });
  }

  cards.forEach((card) => {
    card.addEventListener("pointerenter", () => setActiveCard(card));
    card.addEventListener("pointerleave", () => {
      if (!card.contains(document.activeElement)) setActiveCard(null);
    });
    card.addEventListener("focusin", () => setActiveCard(card));
    card.addEventListener("focusout", () => {
      window.requestAnimationFrame(() => {
        if (!card.contains(document.activeElement)) setActiveCard(null);
      });
    });
  });
})();
