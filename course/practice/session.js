(function () {
  const typeConfig = {
    judge: { label: "判断题" },
    choice: { label: "选择题" },
    fill: { label: "填空题" },
    matching: { label: "配对题" },
  };
  const params = new URLSearchParams(window.location.search);
  const requestedType = params.get("type") || "judge";
  const type = typeConfig[requestedType] ? requestedType : "judge";
  const RESCUE_KEY = "ml_rescue_records";
  const state = {
    answered: 0,
    correct: 0,
    total: 0,
    timer: null,
    recorded: false,
  };

  const correctMessages = [
    "节点修复成功，核心稳定度提升了。",
    "做得好，这条知识回路已经接通。",
    "判断准确，救援进度继续向前。",
    "很好，这个知识节点已经稳定。",
  ];
  const wrongMessages = [
    "核心波动了一下，先看解析，我们马上能修好。",
    "没关系，关键条件已经在解析里了。",
    "这次先记下原因，下一题继续修复。",
  ];

  function randomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
  }

  function setBubble(message) {
    const bubble = document.getElementById("robot-message");
    if (bubble) bubble.textContent = message;
  }

  function setRobotState(nextState, duration) {
    const stage = document.getElementById("robot-stage");
    if (!stage) return;
    if (state.timer) window.clearTimeout(state.timer);
    stage.classList.remove("is-idle", "is-thinking", "is-correct", "is-wrong");
    stage.classList.add(nextState);
    if (duration) {
      state.timer = window.setTimeout(function () {
        stage.classList.remove(nextState);
        stage.classList.add("is-idle");
      }, duration);
    }
  }

  function storageGet() {
    try {
      return JSON.parse(localStorage.getItem(RESCUE_KEY)) || [];
    } catch (error) {
      return [];
    }
  }

  function storageSet(records) {
    localStorage.setItem(RESCUE_KEY, JSON.stringify(records));
  }

  function currentUsername() {
    const user = window.MLAuth ? window.MLAuth.getCurrentUser() : null;
    return user ? user.username : "guest";
  }

  function recordRescue(score, total) {
    if (state.recorded || !total || score / total < 0.7) return false;
    const records = storageGet();
    records.push({
      username: currentUsername(),
      score: score,
      total: total,
      time: new Date().toISOString(),
    });
    storageSet(records);
    state.recorded = true;
    return true;
  }

  function updateMission() {
    const percent = state.total
      ? Math.round((state.correct / state.total) * 100)
      : 0;
    const stability = document.getElementById("mission-stability");
    const bar = document.getElementById("mission-stability-bar");
    const correct = document.getElementById("mission-correct-count");
    const total = document.getElementById("mission-question-count");
    const completed = document.getElementById("session-completed");
    const accuracy = document.getElementById("session-accuracy");
    if (stability) stability.textContent = percent + "%";
    if (bar) bar.style.width = percent + "%";
    if (correct) correct.textContent = String(state.correct);
    if (total) total.textContent = String(state.total);
    if (completed) {
      completed.textContent = state.answered + " / " + state.total;
    }
    if (accuracy) {
      const accuracyPercent = state.answered
        ? Math.round((state.correct / state.answered) * 100)
        : 0;
      accuracy.textContent = accuracyPercent + "%";
    }
  }

  function handleStart(event) {
    state.answered = 0;
    state.correct = 0;
    state.total = event.detail.total || 0;
    state.recorded = false;
    updateMission();
    const completeStatus = document.getElementById("session-complete-status");
    if (completeStatus) completeStatus.textContent = "";
    setRobotState("is-thinking");
    setBubble(
      "救援任务已接入：本次需要修复 " + state.total + " 个知识节点。",
    );
  }

  function handleQuestion(event) {
    const index = Number(event.detail.index) + 1;
    const total = event.detail.total;
    setRobotState("is-thinking");
    setBubble("第 " + index + " / " + total + " 题，先看清关键条件。");
  }

  function handleResult(event) {
    state.answered += 1;
    if (event.detail.correct) {
      state.correct += 1;
      updateMission();
      setRobotState("is-correct", 1300);
      setBubble(randomMessage(correctMessages));
    } else {
      updateMission();
      setRobotState("is-wrong", 1300);
      setBubble(randomMessage(wrongMessages));
    }
  }

  function handleComplete(event) {
    const score = event.detail.score || 0;
    const total = event.detail.total || 0;
    const rate = total ? Math.round((score / total) * 100) : 0;
    state.answered = total;
    const successful = recordRescue(score, total);
    updateMission();
    const completeStatus = document.getElementById("session-complete-status");
    if (completeStatus) {
      completeStatus.textContent = successful
        ? "本次正确率 " + rate + "%，已计入成功救援。"
        : "本次正确率 " + rate + "%，未达到 70%，不计入成功救援。";
    }
    setRobotState(successful ? "is-correct" : "is-wrong");
    setBubble(
      successful
        ? "救援成功，核心已经恢复稳定。"
        : "救援失败，正确率未达到 70%，再试一次。",
    );
  }

  function init() {
    document.body.dataset.practiceType = type;
    const title = document.getElementById("session-title");
    const selectedType = document.getElementById("selected-type");
    const startButton = document.getElementById("session-start");
    if (title) title.textContent = typeConfig[type].label + "救援任务";
    if (selectedType) selectedType.textContent = typeConfig[type].label;
    if (startButton) startButton.dataset.startQuiz = type;

    window.addEventListener("ml-practice-start", handleStart);
    window.addEventListener("ml-practice-question", handleQuestion);
    window.addEventListener("ml-practice-result", handleResult);
    window.addEventListener("ml-practice-complete", handleComplete);

    const restart = document.getElementById("session-restart");
    if (restart && startButton) {
      restart.addEventListener("click", function () {
        startButton.click();
      });
    }

    const quit = document.getElementById("quiz-quit");
    if (quit) {
      quit.addEventListener("click", function () {
        window.location.href = "index.html";
      });
    }

    setRobotState("is-idle");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
