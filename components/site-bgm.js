(function () {
  "use strict";

  const scriptUrl = document.currentScript
    ? document.currentScript.src
    : document.baseURI;
  const audioUrl = new URL("../bgm/Kyle Xian - 云雀.mp3", scriptUrl).href;
  const enabledKey = "ml_bgm_enabled";
  const volumeKey = "ml_bgm_volume";
  const timeKey = "ml_bgm_current_time";

  function readStorage(storage, key, fallback) {
    try {
      const value = storage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(storage, key, value) {
    try {
      storage.setItem(key, String(value));
    } catch (error) {
      // 文件预览或隐私模式可能禁用存储，音乐仍可在当前页面使用。
    }
  }

  class SiteBgm extends HTMLElement {
    constructor() {
      super();
      this.audio = new Audio(audioUrl);
      this.audio.loop = true;
      this.audio.preload = "metadata";
      const savedVolume = Number(
        readStorage(window.localStorage, volumeKey, "0.18"),
      );
      this.audio.volume = Number.isFinite(savedVolume)
        ? Math.min(1, Math.max(0, savedVolume))
        : 0.18;
      this.enabled = readStorage(window.localStorage, enabledKey, "1") !== "0";
      this.lastSavedSecond = -1;
      this.handleUnlock = (event) => {
        if (event.composedPath().includes(this) || !this.enabled) return;
        this.play();
      };
      this.handlePageHide = () => this.saveProgress();
      this.handleOutsidePointer = (event) => {
        if (!event.composedPath().includes(this)) this.closePanel();
      };
      this.handlePanelKeydown = (event) => {
        if (event.key === "Escape") {
          this.closePanel();
          this.iconButton.focus();
        }
      };

      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            position: fixed;
            top: 16px;
            right: 16px;
            left: auto;
            z-index: 999;
            display: block;
            color: #5b3cc4;
          }

          :host([header-control]) {
            position: relative;
            top: auto;
            right: auto;
            left: auto;
            z-index: 2;
            flex: 0 0 auto;
          }

          .player {
            position: relative;
          }

          button,
          input {
            font: inherit;
          }

          .music-icon {
            position: relative;
            display: grid;
            width: 40px;
            height: 40px;
            padding: 0;
            place-items: center;
            color: #5b3cc4;
            background: #ffffff;
            border: 1px solid rgba(109, 75, 209, 0.28);
            border-radius: 50%;
            box-shadow: 0 5px 15px rgba(49, 35, 99, 0.12);
            cursor: pointer;
            transition:
              color 160ms ease,
              background-color 160ms ease,
              transform 160ms ease;
          }

          .music-icon:hover {
            color: #ffffff;
            background: #6d4bd1;
            transform: translateY(-2px);
          }

          .music-icon:focus-visible,
          .playback-button:focus-visible,
          input[type="range"]:focus-visible {
            outline: 3px solid rgba(109, 75, 209, 0.28);
            outline-offset: 3px;
          }

          .note {
            font: 700 20px/1 system-ui, sans-serif;
          }

          .status-dot {
            position: absolute;
            right: 3px;
            bottom: 3px;
            width: 8px;
            height: 8px;
            background: #aaa4b5;
            border: 2px solid #ffffff;
            border-radius: 50%;
          }

          .music-icon[data-playing="true"] .status-dot {
            background: #4fa578;
          }

          .panel {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            left: auto;
            width: 204px;
            padding: 12px;
            color: #403951;
            background: rgba(255, 255, 255, 0.97);
            border: 1px solid rgba(109, 75, 209, 0.2);
            border-radius: 14px;
            box-shadow: 0 12px 30px rgba(49, 35, 99, 0.16);
            backdrop-filter: blur(10px);
          }

          :host([header-control]) .panel,
          :host([align-right]) .panel {
            right: 0;
            left: auto;
          }

          .panel[hidden] {
            display: none;
          }

          .playback-button {
            display: flex;
            width: 100%;
            min-height: 38px;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0 12px;
            color: #fff;
            background: #6d4bd1;
            border: 0;
            border-radius: 10px;
            cursor: pointer;
            font: 700 13px/1 system-ui, sans-serif;
            transition: background-color 160ms ease;
          }

          .playback-button:hover {
            background: #5b3cc4;
          }

          label {
            display: grid;
            grid-template-columns: auto 1fr;
            align-items: center;
            gap: 10px;
            margin-top: 12px;
            color: #6d687b;
            font: 600 12px/1 system-ui, sans-serif;
          }

          input[type="range"] {
            width: 100%;
            margin: 0;
            accent-color: #6d4bd1;
            cursor: pointer;
          }

          @media (max-width: 520px) {
            :host {
              top: 12px;
              right: 10px;
              left: auto;
            }

            .music-icon {
              width: 38px;
              height: 38px;
            }

            :host([header-control]:not([compact-header])) .panel {
              position: fixed;
              top: 136px;
              right: 10px;
              left: auto;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .music-icon,
            .playback-button {
              transition: none;
            }
          }
        </style>
        <div class="player">
          <button
            class="music-icon"
            type="button"
            data-playing="false"
            aria-label="打开音乐设置"
            aria-controls="music-panel"
            aria-expanded="false"
            title="音乐设置"
          >
            <span class="note" aria-hidden="true">♫</span>
            <span class="status-dot" aria-hidden="true"></span>
          </button>
          <div class="panel" id="music-panel" hidden>
            <button class="playback-button" type="button">
              <span class="playback-symbol" aria-hidden="true">▶</span>
              <span class="playback-label">播放音乐</span>
            </button>
            <label>
              <span>音量</span>
              <input type="range" min="0" max="100" step="1" aria-label="背景音乐音量" />
            </label>
          </div>
        </div>
      `;

      this.iconButton = this.shadowRoot.querySelector(".music-icon");
      this.panel = this.shadowRoot.querySelector(".panel");
      this.playbackButton = this.shadowRoot.querySelector(".playback-button");
      this.playbackLabel = this.shadowRoot.querySelector(".playback-label");
      this.playbackSymbol = this.shadowRoot.querySelector(".playback-symbol");
      this.volumeInput = this.shadowRoot.querySelector('input[type="range"]');
      this.volumeInput.value = String(Math.round(this.audio.volume * 100));
      this.iconButton.addEventListener("click", () => this.togglePanel());
      this.playbackButton.addEventListener("click", () => this.toggle());
      this.volumeInput.addEventListener("input", () => {
        this.audio.volume = Number(this.volumeInput.value) / 100;
        writeStorage(window.localStorage, volumeKey, this.audio.volume);
      });
      this.audio.addEventListener("play", () => this.updateButton());
      this.audio.addEventListener("pause", () => this.updateButton());
      this.audio.addEventListener("timeupdate", () => {
        const second = Math.floor(this.audio.currentTime);
        if (second !== this.lastSavedSecond && second % 2 === 0) {
          this.lastSavedSecond = second;
          this.saveProgress();
        }
      });
      this.audio.addEventListener("loadedmetadata", () => {
        const savedTime = Number(readStorage(window.sessionStorage, timeKey, 0));
        if (Number.isFinite(savedTime) && savedTime > 0) {
          this.audio.currentTime = Math.min(savedTime, this.audio.duration || savedTime);
        }
      });
    }

    connectedCallback() {
      document.addEventListener("pointerdown", this.handleUnlock, true);
      document.addEventListener("keydown", this.handleUnlock, true);
      document.addEventListener("pointerdown", this.handleOutsidePointer);
      document.addEventListener("keydown", this.handlePanelKeydown);
      window.addEventListener("pagehide", this.handlePageHide);
      this.updateButton();
      if (this.enabled) this.play();
    }

    disconnectedCallback() {
      document.removeEventListener("pointerdown", this.handleUnlock, true);
      document.removeEventListener("keydown", this.handleUnlock, true);
      document.removeEventListener("pointerdown", this.handleOutsidePointer);
      document.removeEventListener("keydown", this.handlePanelKeydown);
      window.removeEventListener("pagehide", this.handlePageHide);
      this.saveProgress();
      this.audio.pause();
    }

    saveProgress() {
      if (Number.isFinite(this.audio.currentTime)) {
        writeStorage(window.sessionStorage, timeKey, this.audio.currentTime);
      }
    }

    updateButton() {
      const playing = !this.audio.paused;
      this.iconButton.dataset.playing = String(playing);
      this.playbackLabel.textContent = playing ? "暂停音乐" : "播放音乐";
      this.playbackSymbol.textContent = playing ? "Ⅱ" : "▶";
      this.iconButton.setAttribute(
        "aria-label",
        playing ? "打开音乐设置，当前正在播放" : "打开音乐设置，当前已暂停",
      );
    }

    togglePanel() {
      const willOpen = this.panel.hidden;
      this.panel.hidden = !willOpen;
      this.iconButton.setAttribute("aria-expanded", String(willOpen));
    }

    closePanel() {
      if (this.panel.hidden) return;
      this.panel.hidden = true;
      this.iconButton.setAttribute("aria-expanded", "false");
    }

    play() {
      if (!this.enabled || !this.audio.paused) return;
      const result = this.audio.play();
      if (result && typeof result.catch === "function") {
        result.catch(() => this.updateButton());
      }
    }

    toggle() {
      if (this.audio.paused) {
        this.enabled = true;
        writeStorage(window.localStorage, enabledKey, "1");
        this.play();
      } else {
        this.enabled = false;
        writeStorage(window.localStorage, enabledKey, "0");
        this.audio.pause();
        this.saveProgress();
      }
      this.updateButton();
    }
  }

  if (!customElements.get("site-bgm")) {
    customElements.define("site-bgm", SiteBgm);
  }

  function mount() {
    if (!document.querySelector("site-bgm")) {
      const player = document.createElement("site-bgm");
      const accountActions = document.querySelector(
        ".site-header .account-actions",
      );
      const compactTopbar = document.querySelector(".topbar");

      if (accountActions) {
        player.setAttribute("header-control", "");
        accountActions.prepend(player);
      } else if (compactTopbar) {
        player.setAttribute("header-control", "");
        player.setAttribute("compact-header", "");
        compactTopbar.appendChild(player);
      } else {
        if (document.querySelector(".member-back-link")) {
          player.setAttribute("align-right", "");
        }
        document.body.appendChild(player);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
