(function () {
  class MlPeekRobot extends HTMLElement {
    static get observedAttributes() { return ["src", "label", "accessible-label", "disabled"]; }

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; contain: layout; }
          button { position: relative; display: block; width: 100%; height: 100%; padding: 0; overflow: visible; background: transparent; border: 0; cursor: pointer; filter: drop-shadow(0 8px 7px rgba(49,35,99,.12)); }
          button:disabled { cursor: default; }
          img { position: absolute; top: 0; left: 0; width: 100%; height: auto; pointer-events: none; }
          span { position: absolute; top: 22%; left: 85%; width: max-content; padding: 5px 8px; color: #6848c7; background: #fff; border: 1px solid #d9d0f3; border-radius: 9px 9px 9px 2px; font: 800 9px/1.2 system-ui, sans-serif; box-shadow: 0 6px 16px rgba(70,47,135,.10); }
          button:focus-visible { outline: 3px solid rgba(109,75,209,.3); outline-offset: 4px; border-radius: 12px; }
          @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
        </style>
        <button type="button"><img alt="" /><span></span></button>`;
      this.button = this.shadowRoot.querySelector("button");
      this.image = this.shadowRoot.querySelector("img");
      this.caption = this.shadowRoot.querySelector("span");
      this.button.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("peek-activate", { bubbles: true, composed: true }));
      });
    }

    connectedCallback() { this.sync(); }
    attributeChangedCallback() { if (this.button) this.sync(); }

    sync() {
      const src = this.getAttribute("src") || "assets/robot-peek-transparent.png";
      this.image.src = new URL(src, document.baseURI).href;
      this.caption.textContent = this.getAttribute("label") || "";
      this.caption.hidden = !this.caption.textContent;
      this.button.setAttribute("aria-label", this.getAttribute("accessible-label") || this.caption.textContent || "小机器人");
      this.button.disabled = this.hasAttribute("disabled");
    }
  }

  if (!customElements.get("ml-peek-robot")) customElements.define("ml-peek-robot", MlPeekRobot);
})();
