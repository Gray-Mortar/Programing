(function () {
  "use strict";

  const scriptUrl = document.currentScript
    ? document.currentScript.src
    : document.baseURI;
  const audioUrl = new URL("../bgm/Kyle Xian - 云雀.mp3", scriptUrl).href;
  const enabledKey = "ml_bgm_enabled";
  const volumeKey = "ml_bgm_volume";
  const timeKey = "ml_bgm_current_time";
  const stateKey = "ml_bgm_playback_state";

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

  function readPlaybackState() {
    try {
      const state = JSON.parse(
        readStorage(window.sessionStorage, stateKey, "null"),
      );
      if (state && Number.isFinite(Number(state.time))) {
        return {
          time: Number(state.time),
          savedAt: Number(state.savedAt) || 0,
          playing: Boolean(state.playing),
        };
      }
    } catch (error) {
      // 兼容旧版本仅保存播放秒数的记录。
    }
    return {
      time: Number(readStorage(window.sessionStorage, timeKey, 0)) || 0,
      savedAt: 0,
      playing: false,
    };
  }

  const initialVolume = Number(
    readStorage(window.localStorage, volumeKey, "0.18"),
  );
  const initiallyEnabled =
    readStorage(window.localStorage, enabledKey, "1") !== "0";
  const initialPlaybackState = readPlaybackState();
  const sharedAudio = new Audio();
  let sharedPlayPromise = null;
  sharedAudio.loop = true;
  sharedAudio.preload = "auto";
  sharedAudio.volume = Number.isFinite(initialVolume)
    ? Math.min(1, Math.max(0, initialVolume))
    : 0.18;
  sharedAudio.src = audioUrl;

  function restoreSharedProgress() {
    const state = initialPlaybackState;
    if (state.time <= 0) return;
    const elapsed = state.playing && state.savedAt
      ? Math.min(2, Math.max(0, (Date.now() - state.savedAt) / 1000))
      : 0;
    const target = state.time + elapsed;
    sharedAudio.currentTime = sharedAudio.duration
      ? target % sharedAudio.duration
      : target;
  }

  function requestSharedPlayback() {
    if (!sharedAudio.paused) return Promise.resolve(true);
    if (sharedPlayPromise) return sharedPlayPromise;

    try {
      const result = sharedAudio.play();
      if (!result || typeof result.then !== "function") {
        return Promise.resolve(!sharedAudio.paused);
      }
      sharedPlayPromise = result
        .then(() => true, () => false)
        .finally(() => {
          sharedPlayPromise = null;
        });
      return sharedPlayPromise;
    } catch (error) {
      return Promise.resolve(false);
    }
  }

  if (sharedAudio.readyState >= HTMLMediaElement.HAVE_METADATA) {
    restoreSharedProgress();
  } else {
    sharedAudio.addEventListener("loadedmetadata", restoreSharedProgress, {
      once: true,
    });
  }

  if (initiallyEnabled && initialPlaybackState.playing) {
    const startEarlyPlayback = () => {
      requestSharedPlayback();
    };
    if (sharedAudio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      startEarlyPlayback();
    } else {
      sharedAudio.addEventListener("canplay", startEarlyPlayback, { once: true });
    }
  }

  sharedAudio.load();

  class SiteBgm extends HTMLElement {
    constructor() {
      super();
      this.audio = sharedAudio;
      const savedVolume = Number(
        readStorage(window.localStorage, volumeKey, "0.18"),
      );
      this.audio.volume = Number.isFinite(savedVolume)
        ? Math.min(1, Math.max(0, savedVolume))
        : 0.18;
      this.enabled = readStorage(window.localStorage, enabledKey, "1") !== "0";
      this.resumeRequested = this.enabled && initialPlaybackState.playing;
      this.lastSavedSecond = -1;
      this.handleUnlock = (event) => {
        if (event.composedPath().includes(this) || !this.enabled) return;
        this.resumeRequested = true;
        this.play();
      };
      this.handlePageHide = () => {
        if (this.enabled && !this.audio.paused) this.resumeRequested = true;
        this.saveProgress();
      };
      this.handlePageShow = () => {
        if (this.enabled && this.resumeRequested) this.play();
      };
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
      this.audio.addEventListener("play", () => {
        this.resumeRequested = true;
        this.saveProgress();
        this.updateButton();
      });
      this.audio.addEventListener("pause", () => this.updateButton());
      this.audio.addEventListener("timeupdate", () => {
        const second = Math.floor(this.audio.currentTime);
        if (second !== this.lastSavedSecond && second % 2 === 0) {
          this.lastSavedSecond = second;
          this.saveProgress();
        }
      });
    }

    connectedCallback() {
      document.addEventListener("pointerdown", this.handleUnlock, true);
      document.addEventListener("keydown", this.handleUnlock, true);
      document.addEventListener("pointerdown", this.handleOutsidePointer);
      document.addEventListener("keydown", this.handlePanelKeydown);
      window.addEventListener("pagehide", this.handlePageHide);
      window.addEventListener("pageshow", this.handlePageShow);
      this.updateButton();
      if (this.enabled && this.resumeRequested) this.play();
    }

    disconnectedCallback() {
      document.removeEventListener("pointerdown", this.handleUnlock, true);
      document.removeEventListener("keydown", this.handleUnlock, true);
      document.removeEventListener("pointerdown", this.handleOutsidePointer);
      document.removeEventListener("keydown", this.handlePanelKeydown);
      window.removeEventListener("pagehide", this.handlePageHide);
      window.removeEventListener("pageshow", this.handlePageShow);
      this.saveProgress();
      this.audio.pause();
    }

    saveProgress() {
      if (Number.isFinite(this.audio.currentTime)) {
        writeStorage(window.sessionStorage, timeKey, this.audio.currentTime);
        writeStorage(
          window.sessionStorage,
          stateKey,
          JSON.stringify({
            time: this.audio.currentTime,
            savedAt: Date.now(),
            playing: this.enabled && this.resumeRequested,
          }),
        );
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
      this.resumeRequested = true;
      requestSharedPlayback().then(() => this.updateButton());
    }

    toggle() {
      if (this.audio.paused) {
        this.enabled = true;
        this.resumeRequested = true;
        writeStorage(window.localStorage, enabledKey, "1");
        this.play();
      } else {
        this.enabled = false;
        this.resumeRequested = false;
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
    if (
      window.Capacitor?.getPlatform?.() === "android" &&
      !document.querySelector("script[data-ml-app-navigation]")
    ) {
      const navigation = document.createElement("script");
      navigation.src = new URL("app-navigation.js", scriptUrl).href;
      navigation.dataset.mlAppNavigation = "";
      document.head.append(navigation);
    }

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
