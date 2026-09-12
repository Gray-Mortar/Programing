(function () {
  const RECORDS_KEY = "ml_practice_records";
  const questionBank = window.ML_QUESTIONS || {
    judge: [],
    choice: [],
    fill: [],
  };
  let activeQuestions = [];
  let runToken = 0;
  const fishGame = {
    size: 3,
    max: 10,
    kingShown: false,
  };
  const RESTAURANT_MENU = [
    { name: "番茄炒蛋", icon: "🍅", price: 8 },
    { name: "宫保鸡丁", icon: "🍗", price: 12 },
    { name: "红烧肉", icon: "🍖", price: 18 },
    { name: "牛肉面", icon: "🍜", price: 22 },
    { name: "糖醋鱼", icon: "🐟", price: 28 },
    { name: "海鲜炒饭", icon: "🍤", price: 35 },
  ];
  const restaurantGame = {
    cooked: 0,
    money: 0,
    unlocked: 1,
  };

  function storageGet(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
      return [];
    }
  }

  function storageSet(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function currentUsername() {
    const user = window.MLAuth ? window.MLAuth.getCurrentUser() : null;
    return user ? user.username : "guest";
  }

  function userRecords(records) {
    const username = currentUsername();
    return records.filter(function (record) {
      return !record.username || record.username === username;
    });
  }

  function normalizeAnswer(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s，,。.!！?？、（）()\-—_]/g, "");
  }

  function filterQuestions(type, category) {
    return (questionBank[type] || []).filter(function (question) {
      return category === "all" || question.category === category;
    });
  }

  function orderQuestions(questions, mode) {
    const result = questions.slice();
    if (mode !== "random") return result;
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      const current = result[index];
      result[index] = result[target];
      result[target] = current;
    }
    return result;
  }

  function resetPractice() {
    runToken += 1;
    closeFishOverlays();
    document.getElementById("quiz-panel").hidden = true;
    activeQuestions = [];
    document.getElementById("selected-type").textContent = "请选择题型开始练习";
    document.getElementById("quiz-progress").textContent = "";
  }

  function renderStats(records) {
    const list = userRecords(records);
    const correct = list.filter(function (record) {
      return record.correct;
    }).length;
    document.getElementById("practice-done").textContent = String(list.length);
    document.getElementById("practice-correct").textContent = list.length
      ? Math.round((correct / list.length) * 100) + "%"
      : "0%";
    document.getElementById("practice-recent").textContent = list.length
      ? formatTime(list[list.length - 1].time)
      : "暂无";
  }

  function formatTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("zh-CN");
  }

  function populateCategories() {
    const select = document.getElementById("practice-category");
    const categories = [];
    Object.keys(questionBank).forEach(function (type) {
      questionBank[type].forEach(function (question) {
        if (categories.indexOf(question.category) === -1)
          categories.push(question.category);
      });
    });
    categories.forEach(function (category) {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
    });
  }

  function startQuiz(type) {
    runToken += 1;
    closeFishOverlays();
    if (type === "judge") resetFishGame();
    if (type === "fill") resetRestaurantGame();
    const category = document.getElementById("practice-category").value;
    const mode = document.getElementById("practice-order").value;
    activeQuestions = orderQuestions(filterQuestions(type, category), mode);
    const panel = document.getElementById("quiz-panel");
    panel.hidden = false;

    if (!activeQuestions.length) {
      document.getElementById("selected-type").textContent = "暂无匹配题目";
      document.getElementById("quiz-question").textContent =
        "当前章节下没有这种题型，请更换章节或题型。";
      document.getElementById("quiz-options").innerHTML = "";
      document.getElementById("quiz-input-wrap").hidden = true;
      document.getElementById("quiz-submit").hidden = true;
      document.getElementById("quiz-next").hidden = true;
      return;
    }

    panel.dataset.type = type;
    panel.dataset.index = "0";
    panel.dataset.score = "0";
    panel.dataset.answered = "false";
    document.getElementById("selected-type").textContent =
      activeQuestions[0].type;
    renderQuestion(activeQuestions[0]);
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function wait(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

  function renderMiningQuestion(question, optionWrap, panel) {
    optionWrap.classList.add("mining-game");
    optionWrap.setAttribute("role", "group");
    optionWrap.setAttribute("aria-label", "机器人采矿选择题");
    optionWrap.innerHTML = [
      '<div class="mining-scene" aria-hidden="true">',
      '  <div class="mining-hud">ROBOT MINER // ONLINE</div>',
      '  <div class="miner-robot">',
      '    <span class="robot-antenna"></span>',
      '    <span class="robot-head">',
      '      <span class="robot-face">',
      '        <span class="robot-eye"></span>',
      '        <span class="robot-eye"></span>',
      '      </span>',
      '      <span class="robot-mouth"></span>',
      '    </span>',
      '    <span class="robot-body"><span class="robot-core">AI</span></span>',
      '    <span class="robot-arm robot-arm-left"></span>',
      '    <span class="robot-arm robot-arm-right"></span>',
      '  </div>',
      '  <div class="mine-hook">',
      '    <span class="hook-claw"></span>',
      '  </div>',
      '</div>',
      '<div class="mine-field"></div>',
      '<p class="mining-status">选择一块矿石，机器人矿工将自动下钩</p>',
    ].join("");
    optionWrap.querySelector(".mining-status").setAttribute("aria-live", "polite");

    const field = optionWrap.querySelector(".mine-field");
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    question.options.forEach(function (option, index) {
      const button = document.createElement("button");
      button.className = "mine-option";
      button.type = "button";
      button.dataset.value = option;
      button.setAttribute(
        "aria-label",
        "选项 " + (letters[index] || index + 1) + "：" + option,
      );

      const payload = document.createElement("span");
      payload.className = "mining-payload";
      payload.innerHTML = [
        '<span class="mine-label">',
        '  <span class="mine-letter"></span>',
        '  <span class="mine-text"></span>',
        '</span>',
        '<span class="mine-rock"></span>',
      ].join("");
      payload.querySelector(".mine-letter").textContent =
        letters[index] || String(index + 1);
      payload.querySelector(".mine-text").textContent = option;
      button.appendChild(payload);
      button.addEventListener("click", function () {
        beginMining(question, option, button, panel, optionWrap);
      });
      field.appendChild(button);
    });
  }

  async function beginMining(question, option, button, panel, optionWrap) {
    if (panel.dataset.answered === "true") return;

    panel.dataset.answered = "true";
    const token = runToken;
    const isCorrect = option === question.answer;
    const optionButtons = optionWrap.querySelectorAll(".mine-option");
    const status = optionWrap.querySelector(".mining-status");
    const hook = optionWrap.querySelector(".mine-hook");
    const gameRect = optionWrap.getBoundingClientRect();
    const targetRect = button.getBoundingClientRect();
    const targetX =
      targetRect.left - gameRect.left + targetRect.width / 2;
    const targetY =
      targetRect.top - gameRect.top + targetRect.height * 0.72;
    const originX = gameRect.width / 2;
    const originY = Number.parseFloat(window.getComputedStyle(hook).top) || 106;

    optionButtons.forEach(function (item) {
      item.disabled = true;
    });
    button.classList.add("is-selected");
    optionWrap.classList.add("is-mining");
    status.textContent = "锁定目标矿块，钩爪正在下井…";

    hook.style.left = targetX + "px";
    hook.style.height = Math.max(targetY - originY, 44) + "px";
    hook.classList.add("is-extending");

    await wait(840);
    if (token !== runToken || panel.hidden) return;

    hook.classList.add("is-grabbing");
    button.classList.add("is-hooked");
    status.textContent = "抓住矿石，正在回收…";
    await wait(230);
    if (token !== runToken || panel.hidden) return;

    button.style.setProperty("--pull-x", originX - targetX + "px");
    button.style.setProperty("--pull-y", originY - targetY + "px");
    button.classList.add("is-pulled");
    hook.classList.add("is-retracting");
    hook.style.left = originX + "px";
    hook.style.height = "0px";

    await wait(900);
    if (token !== runToken || panel.hidden) return;

    optionWrap.classList.remove("is-mining");
    optionWrap.classList.add(isCorrect ? "is-correct" : "is-wrong");
    button.classList.add(isCorrect ? "is-correct-choice" : "is-wrong-choice");
    status.textContent = isCorrect
      ? "SUCCESS // 正确答案已安全回收，机器人鼓掌中"
      : "ERROR // 拉错了矿石，亮起的矿块是正确答案";

    if (!isCorrect) {
      const correctButton = Array.from(optionButtons).find(function (item) {
        return item.dataset.value === question.answer;
      });
      if (correctButton) {
        correctButton.classList.add("is-answer");
        correctButton.setAttribute("aria-label", "正确答案：" + question.answer);
      }
    }

    finishQuestion(question, option, isCorrect, "mining");
  }

  function resetRestaurantGame() {
    restaurantGame.cooked = 0;
    restaurantGame.money = 0;
    restaurantGame.unlocked = 1;
  }
  function resetFishGame() {
    fishGame.size = 3;
    fishGame.max = 10;
    fishGame.kingShown = false;
    closeFishOverlays();
  }

  function closeFishOverlays() {
    document.querySelectorAll(".fish-result-overlay").forEach(function (overlay) {
      overlay.hidden = true;
    });
  }

  function showFishOverlay(kind) {
    const overlay = document.querySelector(".fish-" + kind + "-overlay");
    if (!overlay) return;
    overlay.hidden = false;
    const focusTarget = overlay.querySelector("button");
    if (focusTarget) {
      window.requestAnimationFrame(function () {
        focusTarget.focus({ preventScroll: true });
      });
    }
  }

  function updateFishInterface(pulse) {
    const size = fishGame.size;
    const hud = document.querySelector(".fish-hud");
    const player = document.querySelector(".player-fish");
    const meter = document.querySelector(".fish-meter__fill");
    const value = document.querySelector(".fish-hud__size-value");
    const state = document.querySelector(".fish-hud__state");

    if (value) value.textContent = String(size);
    if (meter) meter.style.width = (size / fishGame.max) * 100 + "%";
    if (state) {
      if (size === 0) state.textContent = "已死亡";
      else if (size <= 2) state.textContent = "虚弱";
      else if (size === 3) state.textContent = "幼鱼";
      else if (size <= 6) state.textContent = "成长期";
      else if (size <= 9) state.textContent = "强壮鱼";
      else state.textContent = "深海鲨鱼";
    }

    if (player) {
      const visualSize = size === 0 ? 38 : 38 + size * 5;
      player.style.setProperty("--fish-size", visualSize + "px");
      player.classList.toggle("is-shark", size === fishGame.max);
      player.classList.toggle("is-dead", size === 0);
      const badge = player.querySelector(".player-fish__size");
      if (badge) badge.textContent = String(size);
    }

    if (hud) {
      hud.classList.toggle("is-shark", size === fishGame.max);
      hud.classList.toggle("is-dead", size === 0);
      if (pulse) {
        hud.classList.remove("is-pulsing");
        void hud.offsetWidth;
        hud.classList.add("is-pulsing");
        window.setTimeout(function () {
          hud.classList.remove("is-pulsing");
        }, 520);
      }
    }
  }

  function judgeOptionLabel(option) {
    const normalized = normalizeAnswer(option);
    if (normalized === "正确" || normalized === "是") return "是";
    if (normalized === "错误" || normalized === "否") return "否";
    return option;
  }

  function renderFishJudgeQuestion(question, optionWrap) {
    optionWrap.classList.add("fish-game");
    optionWrap.setAttribute("role", "group");
    optionWrap.setAttribute("aria-label", "大鱼吃小鱼判断题");
    optionWrap.innerHTML = [
      '<div class="fish-hud" aria-live="polite">',
      '  <span class="fish-hud__label">鱼体大小</span>',
      '  <span class="fish-hud__size"><span class="fish-hud__size-value">3</span><small>/ 10</small></span>',
      '  <span class="fish-meter"><span class="fish-meter__fill"></span></span>',
      '  <span class="fish-hud__state">幼鱼</span>',
      '</div>',
      '<div class="fish-pond">',
      '  <span class="pond-light"></span>',
      '  <span class="pond-rock pond-rock--left"></span>',
      '  <span class="pond-rock pond-rock--right"></span>',
      '  <span class="pond-weed pond-weed--one"></span>',
      '  <span class="pond-weed pond-weed--two"></span>',
      '  <span class="pond-weed pond-weed--three"></span>',
      '  <span class="pond-fish pond-fish--one"></span>',
      '  <span class="pond-fish pond-fish--two"></span>',
      '  <span class="pond-fish pond-fish--three"></span>',
      '  <span class="pond-fish pond-fish--four"></span>',
      '  <span class="pond-fish pond-fish--five"></span>',
      '  <span class="pond-fish pond-fish--six"></span>',
      '  <span class="pond-fish pond-fish--seven"></span>',
      '  <span class="pond-fish pond-fish--eight"></span>',
      '  <span class="pond-bubble pond-bubble--one"></span>',
      '  <span class="pond-bubble pond-bubble--two"></span>',
      '  <span class="pond-bubble pond-bubble--three"></span>',
      '  <span class="pond-bubble pond-bubble--four"></span>',
      '  <span class="pond-bubble pond-bubble--five"></span>',
      '  <span class="pond-bubble pond-bubble--six"></span>',
      '  <div class="fish-targets"></div>',
      '  <div class="player-fish" aria-hidden="true">',
      '    <span class="player-fish__art">',
      '      <span class="player-fish__tail"></span>',
      '      <span class="player-fish__fin"></span>',
      '      <span class="player-fish__body">',
      '        <span class="player-fish__eye"></span>',
      '        <span class="player-fish__mouth"></span>',
      '      </span>',
      '    </span>',
      '    <span class="player-fish__size">3</span>',
      '  </div>',
      '</div>',
      '<p class="fish-game-status">按住鼠标拖动小鱼，吃掉带有“是”或“否”的鱼</p>',
      '<div class="fish-result-overlay fish-king-overlay" hidden>',
      '  <div class="fish-result-card ocean-king-card">',
      '    <div class="ocean-crown" aria-hidden="true"></div>',
      '    <p class="fish-result-card__eyebrow">ACHIEVEMENT UNLOCKED</p>',
      '    <h3>海洋之王</h3>',
      '    <p>鱼体大小达到 10，你已进化为深海大鲨鱼，可以继续巡游鱼塘。</p>',
      '    <button class="button button-primary" type="button" data-fish-continue>继续巡游</button>',
      '  </div>',
      '</div>',
      '<div class="fish-result-overlay fish-death-overlay" hidden>',
      '  <div class="fish-result-card fish-death-card">',
      '    <div class="fish-death-icon" aria-hidden="true"></div>',
      '    <p class="fish-result-card__eyebrow">CHALLENGE FAILED</p>',
      '    <h3>鱼已死亡</h3>',
      '    <p>鱼体大小降到了 0。重新开始时，体型会恢复到初始值 3。</p>',
      '    <div class="fish-result-card__actions">',
      '      <button class="button button-primary" type="button" data-fish-restart>恢复体型 3 并继续</button>',
      '      <button class="button button-secondary" type="button" data-fish-quit>结束练习</button>',
      '    </div>',
      '  </div>',
      '</div>',
    ].join("");

    const pond = optionWrap.querySelector(".fish-pond");
    const player = optionWrap.querySelector(".player-fish");
    const targetWrap = optionWrap.querySelector(".fish-targets");
    const status = optionWrap.querySelector(".fish-game-status");
    const positions = Math.random() < 0.5 ? ["one", "two"] : ["two", "one"];
    const targets = [];

    question.options.forEach(function (option, index) {
      const label = judgeOptionLabel(option);
      const button = document.createElement("button");
      button.className =
        "judge-fish judge-fish--" + (positions[index] || "one");
      button.type = "button";
      button.dataset.value = option;
      button.setAttribute(
        "aria-label",
        "吃掉带有“" + label + "”的鱼，对应选项：" + option,
      );
      button.innerHTML = [
        '<span class="judge-fish__art">',
        '  <span class="judge-fish__tail"></span>',
        '  <span class="judge-fish__body">',
        '    <span class="judge-fish__eye"></span>',
        '    <span class="judge-fish__label"></span>',
        '  </span>',
        '</span>',
      ].join("");
      button.querySelector(".judge-fish__label").textContent = label;
      button.addEventListener("click", function (event) {
        event.preventDefault();
        eatJudgeFish(question, option, button, optionWrap, pond, targets);
      });
      targetWrap.appendChild(button);
      targets.push(button);
    });

    updateFishInterface(false);

    let previousX = null;
    function movePlayer(event) {
      if (pond.dataset.answered === "true") return;
      const rect = pond.getBoundingClientRect();
      const padding = 34;
      const x = Math.min(
        Math.max(event.clientX - rect.left, padding),
        Math.max(padding, rect.width - padding),
      );
      const y = Math.min(
        Math.max(event.clientY - rect.top, padding + 22),
        Math.max(padding + 22, rect.height - padding),
      );
      if (previousX !== null) {
        player.classList.toggle("is-facing-left", x < previousX - 1);
      }
      previousX = x;
      player.style.left = x + "px";
      player.style.top = y + "px";
    }

    function releaseDrag() {
      pond.classList.remove("is-dragging");
    }

    pond.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (pond.dataset.answered === "true") return;
      pond.classList.add("is-dragging");
      movePlayer(event);
      if (pond.setPointerCapture) {
        try {
          pond.setPointerCapture(event.pointerId);
        } catch (error) {
          // Some browsers can reject pointer capture for synthetic events.
        }
      }
    });
    pond.addEventListener("pointermove", function (event) {
      if (!pond.classList.contains("is-dragging")) return;
      movePlayer(event);
    });
    pond.addEventListener("pointerup", releaseDrag);
    pond.addEventListener("pointercancel", releaseDrag);

    function collisionLoop() {
      if (!pond.isConnected || pond.dataset.answered === "true") return;
      if (pond.classList.contains("is-dragging")) {
        checkFishCollision(question, pond, player, targets);
      }
      window.requestAnimationFrame(collisionLoop);
    }
    window.requestAnimationFrame(collisionLoop);

    optionWrap
      .querySelector("[data-fish-continue]")
      .addEventListener("click", closeFishOverlays);
    optionWrap
      .querySelector("[data-fish-restart]")
      .addEventListener("click", function () {
        fishGame.size = 3;
        fishGame.kingShown = false;
        closeFishOverlays();
        updateFishInterface(true);
        status.textContent = "体型已恢复到 3，请选择下一题继续挑战";
      });
    optionWrap
      .querySelector("[data-fish-quit]")
      .addEventListener("click", function () {
        closeFishOverlays();
        resetPractice();
      });
  }

  function checkFishCollision(question, pond, player, targets) {
    if (pond.dataset.answered === "true") return;
    const playerRect = player.getBoundingClientRect();
    const hitTarget = Array.from(targets).find(function (target) {
      if (target.classList.contains("is-eaten")) return false;
      const targetRect = target.getBoundingClientRect();
      return (
        playerRect.left < targetRect.right - 12 &&
        playerRect.right > targetRect.left + 12 &&
        playerRect.top < targetRect.bottom - 10 &&
        playerRect.bottom > targetRect.top + 10
      );
    });
    if (!hitTarget) return;
    eatJudgeFish(
      question,
      hitTarget.dataset.value,
      hitTarget,
      pond.closest(".fish-game"),
      pond,
      targets,
    );
  }

  async function eatJudgeFish(
    question,
    option,
    target,
    optionWrap,
    pond,
    targets,
  ) {
    if (pond.dataset.answered === "true") return;
    pond.dataset.answered = "true";
    pond.classList.remove("is-dragging");
    const token = runToken;
    const isCorrect = option === question.answer;
    const label = judgeOptionLabel(option);
    const previousSize = fishGame.size;
    const nextSize = Math.max(
      0,
      Math.min(
        fishGame.max,
        previousSize + (isCorrect ? 1 : -1),
      ),
    );
    const status = optionWrap.querySelector(".fish-game-status");
    const player = optionWrap.querySelector(".player-fish");
    const pondRect = pond.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const playerX = playerRect.left - pondRect.left + playerRect.width / 2;
    const playerY = playerRect.top - pondRect.top + playerRect.height / 2;
    const targetX = targetRect.left - pondRect.left + targetRect.width / 2;
    const targetY = targetRect.top - pondRect.top + targetRect.height / 2;

    fishGame.size = nextSize;
    target.style.setProperty("--eat-x", playerX - targetX + "px");
    target.style.setProperty("--eat-y", playerY - targetY + "px");
    target.classList.add("is-eaten");
    player.classList.add(isCorrect ? "is-feeding" : "is-hurt");
    optionWrap.classList.add(isCorrect ? "is-correct" : "is-wrong");
    status.textContent = isCorrect
      ? "美味！判断正确，鱼体大小 +1"
      : "危险！判断错误，鱼体大小 -1";
    targets.forEach(function (item) {
      item.disabled = true;
    });
    updateFishInterface(true);

    await wait(980);
    if (token !== runToken || !optionWrap.isConnected) return;

    let detail = "";
    if (nextSize === 0) {
      detail = "吃错“" + label + "”鱼，体型归零，鱼已死亡。";
      status.textContent = "体型归零，挑战失败";
    } else if (nextSize === fishGame.max) {
      detail = "吞掉“" + label + "”鱼，体型达到 10，进化为大鲨鱼！";
      status.textContent = "体型达到 10，进化为大鲨鱼！";
    } else {
      detail =
        (isCorrect ? "吞掉“" : "吃错“") +
        label +
        "”鱼，体型 " +
        (isCorrect ? "+1" : "-1") +
        "：当前 " +
        nextSize +
        " / 10。";
    }

    finishQuestion(question, option, isCorrect, "fish", detail);

    if (nextSize === fishGame.max && !fishGame.kingShown) {
      fishGame.kingShown = true;
      await wait(180);
      if (token !== runToken) return;
      showFishOverlay("king");
    } else if (nextSize === 0) {
      await wait(220);
      if (token !== runToken) return;
      showFishOverlay("death");
    }
  }
  function updateRestaurantHud() {
    const money = document.querySelector("[data-restaurant-money]");
    const cooked = document.querySelector("[data-restaurant-cooked]");
    const unlocked = document.querySelector("[data-restaurant-unlocked]");
    const progress = document.querySelector(".restaurant-hud__progress i");
    if (money) money.textContent = String(restaurantGame.money);
    if (cooked) cooked.textContent = String(restaurantGame.cooked);
    if (unlocked) {
      unlocked.textContent =
        restaurantGame.unlocked + "/" + RESTAURANT_MENU.length;
    }
    if (progress) {
      progress.style.width =
        (restaurantGame.unlocked / RESTAURANT_MENU.length) * 100 + "%";
    }
  }

  function renderRestaurantQuestion(question, optionWrap) {
    optionWrap.classList.add("restaurant-game");
    optionWrap.setAttribute("role", "group");
    optionWrap.setAttribute("aria-label", "厨师餐厅填空题");
    optionWrap.dataset.answered = "false";
    optionWrap.dataset.state = "menu";
    optionWrap.innerHTML = [
      '<div class="restaurant-hud">',
      '  <div class="restaurant-hud__item"><span>金币</span><strong data-restaurant-money>0</strong></div>',
      '  <div class="restaurant-hud__item"><span>成功做菜</span><strong data-restaurant-cooked>0</strong></div>',
      '  <div class="restaurant-hud__progress"><i></i></div>',
      '  <div class="restaurant-hud__item"><span>菜单</span><strong data-restaurant-unlocked>1/6</strong></div>',
      '</div>',
      '<div class="restaurant-scene">',
      '  <div class="kitchen-door" aria-hidden="true"></div>',
      '  <div class="cooking-steam" aria-hidden="true"><span></span><span></span><span></span></div>',
      '  <div class="customer-group" aria-label="正在等待点餐的客人">',
      '    <div class="customer customer--one">',
      '      <span class="customer-hair"></span>',
      '      <span class="customer-head"><span class="customer-eye customer-eye--left"></span><span class="customer-eye customer-eye--right"></span><span class="customer-mouth"></span></span>',
      '      <span class="customer-body"></span>',
      '    </div>',
      '    <div class="customer customer--two">',
      '      <span class="customer-hair"></span>',
      '      <span class="customer-head"><span class="customer-eye customer-eye--left"></span><span class="customer-eye customer-eye--right"></span><span class="customer-mouth"></span></span>',
      '      <span class="customer-body"></span>',
      '    </div>',
      '    <div class="customer customer--three">',
      '      <span class="customer-hair"></span>',
      '      <span class="customer-head"><span class="customer-eye customer-eye--left"></span><span class="customer-eye customer-eye--right"></span><span class="customer-mouth"></span></span>',
      '      <span class="customer-body"></span>',
      '    </div>',
      '  </div>',
      '  <div class="chef" aria-label="拿着锅铲的大胡子厨师">',
      '    <span class="chef-hat"></span>',
      '    <span class="chef-head">',
      '      <span class="chef-eye chef-eye--left"></span>',
      '      <span class="chef-eye chef-eye--right"></span>',
      '      <span class="chef-nose"></span>',
      '      <span class="chef-beard"></span>',
      '      <span class="chef-moustache"></span>',
      '    </span>',
      '    <span class="chef-body"><span class="chef-apron"></span></span>',
      '    <span class="chef-arm chef-arm--left"></span>',
      '    <span class="chef-arm chef-arm--right"></span>',
      '    <span class="chef-spatula"></span>',
      '    <span class="chef-plate" data-dish=""></span>',
      '  </div>',
      '  <div class="restaurant-counter">',
      '    <span class="counter-panel"></span>',
      '    <button class="menu-sign" type="button" aria-label="点击菜单开始点餐">',
      '      <span class="menu-sign__title">MENU</span>',
      '      <span class="menu-sign__line"></span>',
      '      <span class="menu-sign__dishes"></span>',
      '      <span class="menu-sign__tap">点击展开</span>',
      '    </button>',
      '  </div>',
      '  <div class="order-reminder" aria-hidden="true">先点这里<br>查看菜单</div>',
      '  <div class="menu-question-overlay" hidden>',
      '    <div class="menu-question-card">',
      '      <p class="menu-question-card__eyebrow">ORDER TICKET // 点餐题</p>',
      '      <h3></h3>',
      '      <p>回答正确后，客人才能正式点菜。请输入知识点名称或常用简称。</p>',
      '      <input id="quiz-answer-input" type="text" autocomplete="off" placeholder="输入答案后点击下方按钮" />',
      '    </div>',
      '  </div>',
      '  <div class="order-overlay" hidden>',
      '    <div class="order-card">',
      '      <p class="order-card__eyebrow">ORDER CONFIRMED // 点单成功</p>',
      '      <h3>选择一道菜，厨师马上进后厨制作</h3>',
      '      <p>完成的菜越多，金币和可制作菜样就越多。</p>',
      '      <div class="order-grid"></div>',
      '    </div>',
      '  </div>',
      '  <div class="restaurant-toast" aria-live="polite"></div>',
      '</div>',
      '<p class="restaurant-status" aria-live="polite">点击前台菜单，回答题目后才能点餐</p>',
    ].join("");    const game = optionWrap;
    const menuSign = game.querySelector(".menu-sign");
    const menuDishes = game.querySelector(".menu-sign__dishes");
    const questionOverlay = game.querySelector(".menu-question-overlay");
    const orderOverlay = game.querySelector(".order-overlay");
    const questionCard = game.querySelector(".menu-question-card");
    const orderGrid = game.querySelector(".order-grid");
    const input = game.querySelector("#quiz-answer-input");
    const status = game.querySelector(".restaurant-status");

    RESTAURANT_MENU.forEach(function (dish, index) {
      const line = document.createElement("span");
      line.className = "menu-sign__dish";
      if (index >= restaurantGame.unlocked) line.classList.add("is-locked");
      line.textContent =
        index < restaurantGame.unlocked ? dish.name : "？？？";
      menuDishes.appendChild(line);
    });

    questionCard.querySelector("h3").textContent = question.title;
    RESTAURANT_MENU.forEach(function (dish, index) {
      const dishButton = document.createElement("button");
      const unlocked = index < restaurantGame.unlocked;
      dishButton.className = "dish-card" + (unlocked ? "" : " is-locked");
      dishButton.type = "button";
      dishButton.disabled = !unlocked;
      dishButton.innerHTML = [
        '<span class="dish-card__icon"></span>',
        '<span class="dish-card__name"></span>',
        '<span class="dish-card__price"></span>',
      ].join("");
      dishButton.querySelector(".dish-card__icon").textContent = unlocked
        ? dish.icon
        : "🔒";
      dishButton.querySelector(".dish-card__name").textContent = unlocked
        ? dish.name
        : "待解锁";
      dishButton.querySelector(".dish-card__price").textContent =
        dish.price + " 金币";
      if (unlocked) {
        dishButton.addEventListener("click", function () {
          startCookingDish(dish, question, optionWrap, status);
        });
      }
      orderGrid.appendChild(dishButton);
    });

    updateRestaurantHud();

    menuSign.addEventListener("click", function () {
      if (optionWrap.dataset.answered === "true") return;
      optionWrap.dataset.state = "question";
      questionOverlay.hidden = false;
      document.getElementById("quiz-submit").hidden = false;
      status.textContent = "请回答点餐题，答对后即可选择菜品";
      window.requestAnimationFrame(function () {
        input.focus();
      });
    });
  }

  async function handleRestaurantAnswer(question, userAnswer, isCorrect) {
    const game = document.querySelector(".restaurant-game");
    if (!game || game.dataset.answered === "true") return;
    game.dataset.answered = "true";
    game.dataset.userAnswer = userAnswer;
    const token = runToken;
    const status = game.querySelector(".restaurant-status");
    const customerGroup = game.querySelector(".customer-group");
    const questionOverlay = game.querySelector(".menu-question-overlay");
    const orderOverlay = game.querySelector(".order-overlay");
    const input = game.querySelector("#quiz-answer-input");
    if (input) input.disabled = true;
    document.getElementById("quiz-submit").hidden = true;

    if (!isCorrect) {
      game.dataset.state = "failed";
      game.classList.add("is-wrong", "is-sad");
      customerGroup.classList.add("is-sad", "is-leaving");
      status.textContent = "答案错误，客人失望地离开了餐厅";
      await wait(1180);
      if (token !== runToken || !game.isConnected) return;
      finishQuestion(
        question,
        userAnswer,
        false,
        "restaurant",
        "客人因答案错误失望离开，这道菜没有赚到金币。",
      );
      return;
    }

    game.dataset.state = "ordered";
    game.classList.add("is-correct");
    customerGroup.classList.add("is-satisfied");
    status.textContent = "回答正确！客人已下单，请选择菜品";
    await wait(340);
    if (token !== runToken || !game.isConnected) return;
    questionOverlay.hidden = true;
    orderOverlay.hidden = false;
    const firstDish = orderOverlay.querySelector(".dish-card:not(:disabled)");
    if (firstDish) firstDish.focus({ preventScroll: true });
  }
  async function startCookingDish(dish, question, game, status) {
    if (
      game.dataset.answered !== "true" ||
      game.dataset.state !== "ordered"
    ) {
      return;
    }
    game.dataset.state = "cooking";
    const token = runToken;
    const orderOverlay = game.querySelector(".order-overlay");
    const customerGroup = game.querySelector(".customer-group");
    const plate = game.querySelector(".chef-plate");
    const toast = game.querySelector(".restaurant-toast");
    orderOverlay.hidden = true;
    plate.dataset.dish = dish.name;
    status.textContent = "厨师带着「" + dish.name + "」的订单进入后厨";
    game.classList.add("is-cooking");

    await wait(700);
    if (token !== runToken || !game.isConnected) return;
    game.classList.add("is-frying");
    status.textContent = "后厨正在制作「" + dish.name + "」…";
    await wait(1080);
    if (token !== runToken || !game.isConnected) return;

    game.classList.remove("is-cooking", "is-frying");
    game.classList.add("is-returning", "is-serving");
    status.textContent = "「" + dish.name + "」出锅，厨师正在上菜";
    await wait(760);
    if (token !== runToken || !game.isConnected) return;

    game.classList.remove("is-returning", "is-serving");
    game.classList.add("is-happy");
    customerGroup.classList.add("is-satisfied");

    const previousUnlocked = restaurantGame.unlocked;
    restaurantGame.cooked += 1;
    restaurantGame.money += dish.price;
    restaurantGame.unlocked = Math.min(
      RESTAURANT_MENU.length,
      restaurantGame.unlocked + 1,
    );
    updateRestaurantHud();
    const newlyUnlocked =
      restaurantGame.unlocked > previousUnlocked
        ? RESTAURANT_MENU[restaurantGame.unlocked - 1]
        : null;
    toast.textContent =
      "+" +
      dish.price +
      " 金币" +
      (newlyUnlocked ? " · 解锁 " + newlyUnlocked.name : "");
    game.classList.add("is-earning");
    status.textContent = newlyUnlocked
      ? "制作成功！" + newlyUnlocked.name + " 已加入菜单"
      : "制作成功！厨师开心地鼓起掌来";
    await wait(760);
    if (token !== runToken || !game.isConnected) return;

    const unlockDetail = newlyUnlocked
      ? "菜单已解锁「" +
        newlyUnlocked.name +
        "」，目前可制作 " +
        restaurantGame.unlocked +
        " 道菜。"
      : "全部菜品均已解锁。";
    finishQuestion(
      question,
      game.dataset.userAnswer || "",
      true,
      "restaurant",
      "完成「" +
        dish.name +
        "」，获得 " +
        dish.price +
        " 金币。成功做菜 " +
        restaurantGame.cooked +
        " 次。" +
        unlockDetail,
    );
  }
  function renderQuestion(question) {
    const panel = document.getElementById("quiz-panel");
    const index = Number(panel.dataset.index);
    const feedback = document.getElementById("quiz-feedback");
    const optionWrap = document.getElementById("quiz-options");
    const inputWrap = document.getElementById("quiz-input-wrap");
    const questionElement = document.getElementById("quiz-question");
    const metaElement = document.getElementById("quiz-meta");

    feedback.className = "quiz-feedback";
    feedback.textContent = "";
    panel.dataset.answered = "false";
    questionElement.textContent = question.title;
    questionElement.hidden = panel.dataset.type === "fill";
    metaElement.hidden = panel.dataset.type === "fill";
    metaElement.innerHTML =
      "<span>" +
      question.category +
      "</span><span>" +
      question.difficulty +
      "</span>";
    document.getElementById("quiz-progress").textContent =
      "第 " + (index + 1) + " / " + activeQuestions.length + " 题";
    optionWrap.className = "quiz-options";
    optionWrap.removeAttribute("role");
    optionWrap.removeAttribute("aria-label");
    optionWrap.innerHTML = "";
    inputWrap.innerHTML = "";
    inputWrap.hidden = true;
    document.getElementById("quiz-submit").hidden = false;
    document.getElementById("quiz-submit").textContent =
      panel.dataset.type === "fill" ? "提交答案并点菜" : "提交答案";
    document.getElementById("quiz-next").hidden = true;
    document.getElementById("quiz-quit").hidden = false;

    if (panel.dataset.type === "choice" && question.options.length) {
      renderMiningQuestion(question, optionWrap, panel);
      document.getElementById("quiz-submit").hidden = true;
    } else if (panel.dataset.type === "judge" && question.options.length) {
      renderFishJudgeQuestion(question, optionWrap);
      document.getElementById("quiz-submit").hidden = true;
    } else if (question.options.length) {
      question.options.forEach(function (option) {
        const button = document.createElement("button");
        button.className = "quiz-option";
        button.type = "button";
        button.textContent = option;
        button.dataset.value = option;
        button.addEventListener("click", function () {
          optionWrap.querySelectorAll(".quiz-option").forEach(function (item) {
            item.classList.remove("is-selected", "is-correct", "is-wrong");
            delete item.dataset.selected;
          });
          button.classList.add("is-selected");
          button.dataset.selected = "true";
        });
        optionWrap.appendChild(button);
      });
    } else if (panel.dataset.type === "fill") {
      renderRestaurantQuestion(question, optionWrap);
      document.getElementById("quiz-submit").hidden = true;
    } else {
      const input = document.createElement("input");
      input.className = "quiz-input";
      input.type = "text";
      input.placeholder = "请输入知识点名称或常用简称";
      input.id = "quiz-answer-input";
      inputWrap.appendChild(input);
      inputWrap.hidden = false;
    }
  }

  function finishQuestion(
    question,
    userAnswer,
    isCorrect,
    presentation,
    detail,
  ) {
    const panel = document.getElementById("quiz-panel");
    const feedback = document.getElementById("quiz-feedback");
    const isMining = presentation === "mining";
    const isFish = presentation === "fish";
    const isRestaurant = presentation === "restaurant";
    let resultMessage = "";

    if (isCorrect) {
      if (isMining) resultMessage = "SUCCESS · 回答正确。";
      else if (isFish) resultMessage = detail || "吞掉正确鱼，体型 +1。";
      else if (isRestaurant) resultMessage = detail || "订单制作成功。";
      else resultMessage = "回答正确。";
    } else if (isMining) {
      resultMessage = "ERROR · 拉错矿石！";
    } else if (isFish) {
      resultMessage = detail || "吃错鱼，体型 -1。";
    } else if (isRestaurant) {
      resultMessage = detail || "客人失望地离开了。";
    } else {
      resultMessage = "回答错误，正确答案是：" + question.answer + "。";
    }

    panel.dataset.answered = "true";
    if (isCorrect)
      panel.dataset.score = String(Number(panel.dataset.score) + 1);
    feedback.className =
      "quiz-feedback " + (isCorrect ? "is-correct" : "is-wrong");
    feedback.textContent = resultMessage + question.explanation;

    const record = {
      username: currentUsername(),
      type: question.type,
      title: question.title,
      category: question.category,
      difficulty: question.difficulty,
      answer: question.answer,
      userAnswer: userAnswer,
      correct: isCorrect,
      time: new Date().toISOString(),
    };
    if (isFish) record.fishSize = fishGame.size;

    const records = storageGet(RECORDS_KEY);
    records.push(record);
    storageSet(RECORDS_KEY, records);
    renderStats(records);
    document.getElementById("quiz-submit").hidden = true;
    document.getElementById("quiz-next").hidden = false;
  }
  function submitAnswer() {
    const panel = document.getElementById("quiz-panel");
    if (panel.dataset.answered === "true" || panel.dataset.type !== "fill")
      return;

    const question = activeQuestions[Number(panel.dataset.index)];
    const feedback = document.getElementById("quiz-feedback");
    let userAnswer = "";
    let isCorrect = false;

    if (question.options.length) {
      const selected = document.querySelector(
        ".quiz-option[data-selected='true']",
      );
      if (!selected) {
        feedback.className = "quiz-feedback is-wrong";
        feedback.textContent = "请先选择一个答案。";
        return;
      }
      userAnswer = selected.dataset.value;
      isCorrect = userAnswer === question.answer;
      document.querySelectorAll(".quiz-option").forEach(function (item) {
        item.disabled = true;
        item.classList.remove("is-selected");
        if (item.dataset.value === question.answer)
          item.classList.add("is-correct");
        else if (item.dataset.selected === "true")
          item.classList.add("is-wrong");
      });
    } else {
      const input = document.getElementById("quiz-answer-input");
      userAnswer = input.value;
      if (!userAnswer.trim()) {
        feedback.className = "quiz-feedback is-wrong";
        feedback.textContent = "请填写答案。";
        return;
      }
      const acceptedAnswers = question.acceptedAnswers || [question.answer];
      isCorrect = acceptedAnswers.some(function (answer) {
        return normalizeAnswer(answer) === normalizeAnswer(userAnswer);
      });
      input.disabled = true;
      if (panel.dataset.type === "fill") {
        handleRestaurantAnswer(question, userAnswer, isCorrect);
        return;
      }
    }

    finishQuestion(question, userAnswer, isCorrect);
  }
  function nextQuestion() {
    const currentPanel = document.getElementById("quiz-panel");
    if (currentPanel.dataset.type === "judge" && fishGame.size === 0) return;
    runToken += 1;
    closeFishOverlays();
    const panel = currentPanel;
    let index = Number(panel.dataset.index) + 1;
    if (index >= activeQuestions.length) index = 0;
    panel.dataset.index = String(index);
    renderQuestion(activeQuestions[index]);
  }
  window.MLPracticeHelpers = {
    normalizeAnswer: normalizeAnswer,
    filterQuestions: filterQuestions,
    orderQuestions: orderQuestions,
  };

  document.addEventListener("DOMContentLoaded", function () {
    renderStats(storageGet(RECORDS_KEY));
    populateCategories();
    resetPractice();
    document.querySelectorAll("[data-start-quiz]").forEach(function (button) {
      button.addEventListener("click", function () {
        startQuiz(button.dataset.startQuiz);
      });
    });
    document
      .getElementById("quiz-submit")
      .addEventListener("click", submitAnswer);
    document
      .getElementById("quiz-next")
      .addEventListener("click", nextQuestion);
    document
      .getElementById("quiz-quit")
      .addEventListener("click", resetPractice);
  });
})();
