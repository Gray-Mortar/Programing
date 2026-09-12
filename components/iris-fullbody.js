(function () {
  const scriptUrl = document.currentScript
    ? document.currentScript.src
    : document.baseURI;
  const assetUrl = (name) => new URL(`assets/${name}`, scriptUrl).href;
  const poseSources = {
    wave: assetUrl("iris-wave.png"),
    standing: assetUrl("iris-standing.png"),
  };
  const waveFrames = {
    standing: poseSources.standing,
    mid: assetUrl("iris-wave-mid.png"),
    raised: poseSources.wave,
    out: assetUrl("iris-wave-out.png"),
  };

  class IrisFullbody extends HTMLElement {
    static get observedAttributes() {
      return [
        "src",
        "pose",
        "label",
        "accessible-label",
        "disabled",
        "passive",
        "hidden",
      ];
    }

    constructor() {
      super();
      this.animationTimers = [];
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            width: var(--iris-fullbody-width, 240px);
            aspect-ratio: 2 / 3;
            -webkit-user-select: none;
            user-select: none;
          }

          :host([hidden]) {
            display: none !important;
          }

          .figure {
            position: relative;
            width: 100%;
            height: 100%;
            padding: 0;
            overflow: visible;
            background: transparent;
            border: 0;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            transition:
              transform 180ms ease,
              filter 180ms ease;
          }

          :host(:hover) .figure {
            filter: drop-shadow(0 10px 10px rgba(49, 35, 99, 0.14));
            transform: translateY(-3px);
          }

          :host([passive]) .figure {
            cursor: default;
          }

          img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: contain;
            -webkit-user-drag: none;
            pointer-events: none;
          }

          .figure:focus-visible {
            border-radius: 18px;
            outline: 3px solid rgba(109, 75, 209, 0.3);
            outline-offset: 5px;
          }

          @media (prefers-reduced-motion: reduce) {
            .figure {
              transition: none;
            }

            :host(:hover) .figure {
              transform: none;
            }

          }
        </style>
        <div class="figure">
          <img alt="" draggable="false" />
        </div>
      `;

      this.figure = this.shadowRoot.querySelector(".figure");
      this.image = this.shadowRoot.querySelector("img");
      this.figure.addEventListener("click", () => this.activate());
      this.figure.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        this.activate();
      });
    }

    connectedCallback() {
      this.sync();
    }

    disconnectedCallback() {
      this.stopWaveAnimation();
    }

    attributeChangedCallback() {
      if (this.figure) this.sync();
    }

    activate() {
      if (this.hasAttribute("passive") || this.hasAttribute("disabled")) return;
      this.dispatchEvent(
        new CustomEvent("iris-fullbody-activate", {
          bubbles: true,
          composed: true,
        }),
      );
    }

    stopWaveAnimation() {
      this.animationTimers.forEach((timer) => window.clearTimeout(timer));
      this.animationTimers = [];
    }

    startWaveAnimation() {
      this.stopWaveAnimation();

      const customSource = this.getAttribute("src");
      const pose = this.getAttribute("pose") || "wave";
      if (
        customSource ||
        pose !== "wave" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      Object.values(waveFrames).forEach((source) => {
        const image = new Image();
        image.src = source;
      });

      const setFrame = (source) => {
        if (this.isConnected && (this.getAttribute("pose") || "wave") === "wave") {
          this.image.src = source;
        }
      };
      const schedule = (source, delay) => {
        this.animationTimers.push(
          window.setTimeout(() => setFrame(source), delay),
        );
      };

      const wave = (includeLift = false) => {
        if (includeLift) {
          schedule(waveFrames.standing, 0);
          schedule(waveFrames.mid, 150);
          schedule(waveFrames.raised, 300);
        } else {
          schedule(waveFrames.mid, 0);
          schedule(waveFrames.raised, 150);
        }
        schedule(waveFrames.out, 450);
        schedule(waveFrames.raised, 600);
        schedule(waveFrames.out, 750);
        schedule(waveFrames.raised, 900);
        this.animationTimers.push(
          window.setTimeout(() => {
            this.stopWaveAnimation();
            wave(false);
          }, 3900),
        );
      };

      wave(true);
    }

    sync() {
      const passive = this.hasAttribute("passive");
      const disabled = this.hasAttribute("disabled");
      const pose = this.getAttribute("pose") || "wave";
      const customSource = this.getAttribute("src");
      this.image.src = customSource
        ? new URL(customSource, document.baseURI).href
        : poseSources[pose] || poseSources.wave;
      this.startWaveAnimation();

      if (passive) {
        this.figure.removeAttribute("role");
        this.figure.removeAttribute("tabindex");
        this.figure.removeAttribute("aria-label");
        this.setAttribute("aria-hidden", "true");
        return;
      }

      this.removeAttribute("aria-hidden");
      this.figure.setAttribute("role", "button");
      this.figure.tabIndex = disabled ? -1 : 0;
      this.figure.setAttribute(
        "aria-label",
        this.getAttribute("accessible-label") ||
          this.getAttribute("label") ||
          "Iris",
      );
      this.figure.setAttribute("aria-disabled", String(disabled));
    }
  }

  if (!customElements.get("iris-fullbody")) {
    customElements.define("iris-fullbody", IrisFullbody);
  }
})();
