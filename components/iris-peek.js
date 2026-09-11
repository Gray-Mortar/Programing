(function () {
  const scriptUrl = document.currentScript
    ? document.currentScript.src
    : document.baseURI;
  const assetUrl = (name) => new URL(`assets/${name}`, scriptUrl).href;
  const defaultImageUrl = assetUrl("iris-peek.png");
  const defaultAnimationFrames = [
    defaultImageUrl,
    assetUrl("iris-peek-half-blink.png"),
    assetUrl("iris-peek-blink.png"),
    assetUrl("iris-peek-half-blink.png"),
    defaultImageUrl,
  ];

  class IrisPeek extends HTMLElement {
    static get observedAttributes() {
      return [
        "src",
        "label",
        "accessible-label",
        "disabled",
        "passive",
        "active",
        "animated",
      ];
    }

    constructor() {
      super();
      this.animationTimers = [];
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            position: absolute;
            z-index: var(--iris-z-index, 5);
            top: calc(-1 * var(--iris-height, 123px));
            left: var(--iris-left, 28px);
            display: block;
            width: var(--iris-width, 260px);
            height: var(--iris-height, 123px);
            contain: layout;
          }

          :host([placement="bottom"]) {
            top: calc(100% - var(--iris-edge-overlap, 0px));
            transform: scaleY(-1);
            transform-origin: center;
          }

          :host([passive]) {
            pointer-events: none;
          }

          .figure {
            position: relative;
            display: block;
            width: 100%;
            height: 100%;
            padding: 0;
            overflow: visible;
            background: transparent;
            border: 0;
            cursor: pointer;
            filter: drop-shadow(0 8px 7px rgba(49, 35, 99, 0.12));
          }

          :host([placement="bottom"]) .figure {
            opacity: 0;
            transform: translateY(82%);
            transition:
              opacity 160ms ease,
              transform 440ms cubic-bezier(0.2, 0.82, 0.22, 1);
          }

          :host([placement="bottom"][active]) .figure {
            opacity: 1;
            transform: translateY(0);
          }

          :host([passive]) .figure {
            cursor: default;
          }

          img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: auto;
            pointer-events: none;
          }

          span {
            position: absolute;
            top: 22%;
            left: 85%;
            width: max-content;
            padding: 5px 8px;
            color: #6848c7;
            background: #ffffff;
            border: 1px solid #d9d0f3;
            border-radius: 9px 9px 9px 2px;
            box-shadow: 0 6px 16px rgba(70, 47, 135, 0.1);
            font: 800 9px/1.2 system-ui, sans-serif;
          }

          .figure:focus-visible {
            border-radius: 12px;
            outline: 3px solid rgba(109, 75, 209, 0.3);
            outline-offset: 4px;
          }

          @media (prefers-reduced-motion: reduce) {
            :host([placement="bottom"]) .figure {
              transition: none;
            }
          }
        </style>
        <div class="figure">
          <img alt="" />
          <span></span>
        </div>
      `;

      this.figure = this.shadowRoot.querySelector(".figure");
      this.image = this.shadowRoot.querySelector("img");
      this.caption = this.shadowRoot.querySelector("span");
      this.figure.addEventListener("click", () => this.activate());
      this.figure.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.activate();
        }
      });
    }

    connectedCallback() {
      this.sync();
    }

    disconnectedCallback() {
      this.stopAnimation();
    }

    attributeChangedCallback() {
      if (this.figure) this.sync();
    }

    activate() {
      if (this.hasAttribute("passive") || this.hasAttribute("disabled")) return;
      this.dispatchEvent(
        new CustomEvent("iris-activate", { bubbles: true, composed: true }),
      );
    }

    stopAnimation() {
      this.animationTimers.forEach((timer) => window.clearTimeout(timer));
      this.animationTimers = [];
    }

    startAnimation() {
      this.stopAnimation();
      const customSource = this.getAttribute("src");
      const frames = customSource
        ? [new URL(customSource, document.baseURI).href]
        : defaultAnimationFrames;
      frames.forEach((source) => {
        const image = new Image();
        image.src = source;
      });
      this.image.src = frames[0];

      if (
        frames.length === 1 ||
        !this.hasAttribute("animated") ||
        !this.hasAttribute("active") ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      const blink = () => {
        [1, 2, 3, 4].forEach((frameIndex, index) => {
          this.animationTimers.push(
            window.setTimeout(() => {
              if (this.hasAttribute("active")) {
                this.image.src = frames[frameIndex];
              }
            }, 620 + index * 95),
          );
        });
        this.animationTimers.push(window.setTimeout(blink, 3400));
      };
      blink();
    }

    sync() {
      const passive = this.hasAttribute("passive");
      const disabled = this.hasAttribute("disabled");
      this.caption.textContent = this.getAttribute("label") || "";
      this.caption.hidden = passive || !this.caption.textContent;

      if (passive) {
        this.figure.removeAttribute("role");
        this.figure.removeAttribute("tabindex");
        this.figure.removeAttribute("aria-label");
        this.setAttribute("aria-hidden", "true");
      } else {
        this.removeAttribute("aria-hidden");
        this.figure.setAttribute("role", "button");
        this.figure.tabIndex = disabled ? -1 : 0;
        this.figure.setAttribute(
          "aria-label",
          this.getAttribute("accessible-label") ||
            this.caption.textContent ||
            "Iris",
        );
        this.figure.setAttribute("aria-disabled", String(disabled));
      }

      this.startAnimation();
    }
  }

  if (!customElements.get("iris-peek")) {
    customElements.define("iris-peek", IrisPeek);
  }
})();
