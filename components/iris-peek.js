(function () {
  const scriptUrl = document.currentScript
    ? document.currentScript.src
    : document.baseURI;
  const assetUrl = (name) => new URL(`assets/${name}`, scriptUrl).href;
  const defaultImageUrl = assetUrl("iris-peek.png");
  const standingPoseUrls = {
    standing: assetUrl("iris-standing.png"),
    wave: assetUrl("iris-wave.png"),
  };
  const standingWaveFrames = {
    mid: assetUrl("iris-wave-mid.png"),
    raised: standingPoseUrls.wave,
    out: assetUrl("iris-wave-out.png"),
  };
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
        "placement",
        "rise",
        "standing",
        "standing-pose",
        "hidden",
      ];
    }

    constructor() {
      super();
      this.animationTimers = [];
      this.pointerSurface = null;
      this.handleHeaderPointerMove = (event) => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const bounds = this.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top;
        const horizontal = Math.max(
          -1,
          Math.min(1, (event.clientX - centerX) / 260),
        );
        const vertical = Math.max(
          -1,
          Math.min(1, (event.clientY - centerY) / 120),
        );

        this.style.setProperty("--iris-shift-x", `${horizontal * 10}px`);
        this.style.setProperty("--iris-shift-y", `${vertical * 5}px`);
        this.style.setProperty("--iris-tilt", `${horizontal * 7}deg`);
      };
      this.handleHeaderPointerLeave = () => this.resetPointerReaction();
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
            -webkit-user-select: none;
            user-select: none;
          }

          :host([hidden]) {
            display: none !important;
          }

          :host([placement="header"]) {
            top: calc(100% - var(--iris-header-overlap, 7px));
            right: var(--iris-right, 18px);
            bottom: auto;
            left: auto;
            width: var(--iris-width, 112px);
            height: var(--iris-height, 53px);
            pointer-events: none;
          }

          :host([placement="hero"]) {
            top: auto;
            bottom: var(--iris-hero-bottom, -1px);
            left: var(--iris-left, 18px);
          }

          :host([rise]:not([placement="header"])) {
            height: var(--iris-rise-height, 320px);
          }

          :host([placement="bottom"]) {
            top: calc(100% - var(--iris-edge-overlap, 0px));
            transform: scaleY(-1);
            transform-origin: center;
          }

          :host([passive]) {
            pointer-events: none;
          }

          /* 页眉挂件不承担按钮功能，但仍要能感知鼠标靠近。 */
          :host([placement="header"][passive]) {
            pointer-events: auto;
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
            -webkit-tap-highlight-color: transparent;
            -webkit-user-select: none;
            user-select: none;
            filter: drop-shadow(0 8px 7px rgba(49, 35, 99, 0.12));
            transform: translate3d(
                var(--iris-shift-x, 0px),
                var(--iris-shift-y, 0px),
                0
              )
              rotate(var(--iris-tilt, 0deg));
            transform-origin: 50% 100%;
            transition: transform 180ms ease;
          }

          :host([placement="bottom"]) .figure {
            opacity: 0;
            transform: translateY(82%);
            transition:
              opacity 160ms ease,
              transform 440ms cubic-bezier(0.2, 0.82, 0.22, 1);
          }

          :host([placement="header"]) .figure {
            cursor: pointer;
            filter: drop-shadow(0 4px 4px rgba(49, 35, 99, 0.11));
            transform-origin: 50% 0;
          }

          :host([placement="header"]:hover) .figure {
            filter:
              drop-shadow(0 6px 7px rgba(49, 35, 99, 0.18))
              brightness(1.04);
          }

          :host([placement="header"]) span {
            display: none;
          }

          :host([placement="header"]) img {
            transform: scaleY(-1);
            transform-origin: center;
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
            -webkit-user-drag: none;
            user-select: none;
            pointer-events: none;
          }

          .standing-image {
            display: none;
          }

          :host([rise]:not([placement="header"])) .peek-image {
            top: auto;
            bottom: 0;
            opacity: 1;
            transform: translateY(0) scale(1);
            transform-origin: 50% 100%;
            transition:
              opacity 180ms ease 260ms,
              transform 460ms cubic-bezier(0.2, 0.82, 0.22, 1);
          }

          :host([rise]:not([placement="header"])) .standing-image {
            display: block;
            top: auto;
            bottom: var(--iris-standing-bottom, 0px);
            left: 50%;
            width: var(--iris-standing-width, 74%);
            opacity: 0;
            transform: translate3d(-50%, 48%, 0) scale(0.9);
            transform-origin: 50% 100%;
            transition:
              opacity 220ms ease 80ms,
              transform 720ms cubic-bezier(0.16, 0.84, 0.24, 1);
          }

          :host([rise][standing]:not([placement="header"])) .peek-image {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
            transition-delay: 0ms;
          }

          :host([rise][standing]:not([placement="header"])) .standing-image {
            opacity: 1;
            transform: translate3d(-50%, 0, 0) scale(1);
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
            .figure {
              transform: none;
              transition: none;
            }

            :host([placement="bottom"]) .figure {
              transition: none;
            }

            :host([rise]:not([placement="header"])) .peek-image,
            :host([rise]:not([placement="header"])) .standing-image {
              transition: none;
            }
          }
        </style>
        <div class="figure">
          <img class="peek-image" alt="" draggable="false" />
          <img class="standing-image" alt="" draggable="false" />
          <span></span>
        </div>
      `;

      this.figure = this.shadowRoot.querySelector(".figure");
      this.image = this.shadowRoot.querySelector(".peek-image");
      this.standingImage = this.shadowRoot.querySelector(".standing-image");
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
      this.teardownPointerReaction();
    }

    attributeChangedCallback() {
      if (this.figure) this.sync();
    }

    activate() {
      if (this.hasAttribute("disabled")) return;

      if (this.getAttribute("placement") === "header") {
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollBy({
          top: Math.min(240, Math.round(window.innerHeight * 0.28)),
          left: 0,
          behavior: reduceMotion ? "auto" : "smooth",
        });
        return;
      }

      if (this.hasAttribute("passive")) return;
      this.dispatchEvent(
        new CustomEvent("iris-activate", { bubbles: true, composed: true }),
      );
    }

    stopAnimation() {
      this.animationTimers.forEach((timer) => window.clearTimeout(timer));
      this.animationTimers = [];
    }

    startStandingWaveAnimation() {
      if (
        !this.hasAttribute("rise") ||
        !this.hasAttribute("standing") ||
        (this.getAttribute("standing-pose") || "standing") !== "wave" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      Object.values(standingWaveFrames).forEach((source) => {
        const image = new Image();
        image.src = source;
      });

      const setFrame = (source) => {
        if (
          this.isConnected &&
          this.hasAttribute("standing") &&
          (this.getAttribute("standing-pose") || "standing") === "wave"
        ) {
          this.standingImage.src = source;
        }
      };
      const schedule = (source, delay) => {
        this.animationTimers.push(
          window.setTimeout(() => setFrame(source), delay),
        );
      };

      const wave = () => {
        schedule(standingWaveFrames.mid, 0);
        schedule(standingWaveFrames.raised, 150);
        schedule(standingWaveFrames.out, 450);
        schedule(standingWaveFrames.raised, 600);
        schedule(standingWaveFrames.out, 750);
        schedule(standingWaveFrames.raised, 900);
        this.animationTimers.push(
          window.setTimeout(() => {
            this.stopAnimation();
            wave();
          }, 3900),
        );
      };

      wave();
    }

    resetPointerReaction() {
      this.style.setProperty("--iris-shift-x", "0px");
      this.style.setProperty("--iris-shift-y", "0px");
      this.style.setProperty("--iris-tilt", "0deg");
    }

    teardownPointerReaction() {
      if (!this.pointerSurface) return;
      this.pointerSurface.removeEventListener(
        "pointermove",
        this.handleHeaderPointerMove,
      );
      this.pointerSurface.removeEventListener(
        "pointerleave",
        this.handleHeaderPointerLeave,
      );
      this.pointerSurface = null;
      this.resetPointerReaction();
    }

    setupPointerReaction() {
      this.teardownPointerReaction();
      if (
        this.getAttribute("placement") !== "header" ||
        this.hidden ||
        !this.hasAttribute("active")
      ) {
        return;
      }

      this.pointerSurface = this.closest(".site-header") || this.parentElement;
      if (!this.pointerSurface) return;
      this.pointerSurface.addEventListener(
        "pointermove",
        this.handleHeaderPointerMove,
      );
      this.pointerSurface.addEventListener(
        "pointerleave",
        this.handleHeaderPointerLeave,
      );
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
      const headerScroller = this.getAttribute("placement") === "header";
      if (this.hasAttribute("rise")) {
        const standingPose = this.getAttribute("standing-pose") || "standing";
        const standingSource =
          standingPoseUrls[standingPose] || standingPoseUrls.standing;
        if (this.standingImage.src !== standingSource) {
          this.standingImage.src = standingSource;
        }
      }
      this.caption.textContent = this.getAttribute("label") || "";
      this.caption.hidden = passive || !this.caption.textContent;

      if (passive && !headerScroller) {
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
            (headerScroller ? "点击 Iris 向下浏览" : "Iris"),
        );
        this.figure.setAttribute("aria-disabled", String(disabled));
      }

      this.startAnimation();
      this.startStandingWaveAnimation();
      this.setupPointerReaction();
    }
  }

  if (!customElements.get("iris-peek")) {
    customElements.define("iris-peek", IrisPeek);
  }
})();
