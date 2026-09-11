(function () {
  const RECORDS_KEY = "ml_practice_records";
  const RESCUE_KEY = "ml_rescue_records";
  const questionBank = window.ML_QUESTIONS || {
    judge: [],
    choice: [],
    fill: [],
    matching: [],
  };
  let activeQuestions = [];
  let matchingState = {
    questionKey: "",
    selectedId: "",
    placements: {},
    sourceOrder: [],
    targetOrder: [],
  };

  const matchingPalettes = [
    { accent: "#6d4bd1", soft: "#eee9ff" },
    { accent: "#23745e", soft: "#e2f5ee" },
    { accent: "#c77d26", soft: "#fff1dc" },
    { accent: "#3f74c9", soft: "#e6effb" },
    { accent: "#b34d78", soft: "#fbe7f0" },
    { accent: "#118a8a", soft: "#e2f6f6" },
  ];

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

  function shuffled(items) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      const current = result[index];
      result[index] = result[target];
      result[target] = current;
    }
    return result;
  }

  function stringHash(value) {
    return String(value).split("").reduce(function (hash, character) {
      return (hash * 31 + character.charCodeAt(0)) >>> 0;
    }, 7);
  }

  function createMatchingVisual(key) {
    const hash = stringHash(key);
    const palette = matchingPalettes[hash % matchingPalettes.length];
    const patterns = [
      '<circle cx="32" cy="32" r="17"></circle><circle cx="32" cy="32" r="6"></circle><path d="M32 8v10M32 46v10M8 32h10M46 32h10"></path>',
      '<rect x="12" y="12" width="16" height="16" rx="4"></rect><rect x="36" y="12" width="16" height="16" rx="4"></rect><rect x="24" y="36" width="16" height="16" rx="4"></rect><path d="M28 20h8M20 28l7 8M44 28l-7 8"></path>',
      '<path d="M10 44c8-22 18 8 27-12 7-15 13-6 17-14"></path><circle cx="10" cy="44" r="4"></circle><circle cx="54" cy="18" r="4"></circle>',
      '<path d="M32 8l20 12v24L32 56 12 44V20z"></path><path d="M32 18l11 7v14l-11 7-11-7V25z"></path>',
      '<circle cx="16" cy="18" r="5"></circle><circle cx="48" cy="16" r="5"></circle><circle cx="22" cy="46" r="5"></circle><circle cx="48" cy="46" r="5"></circle><path d="M21 20l22-2M19 23l2 18M27 46h16M48 21v20"></path>',
      '<path d="M13 46V32M25 46V20M37 46V26M49 46V12"></path><path d="M10 49h42"></path>',
      '<path d="M12 40c8-2 9-12 18-12s10 10 18 12"></path><path d="M12 26c8-2 9-12 18-12s10 10 18 12"></path>',
      '<path d="M32 10l20 11-20 11-20-11z"></path><path d="M12 32l20 11 20-11M12 43l20 11 20-11"></path>',
    ];
    return (
      '<svg class="matching-visual" viewBox="0 0 64 64" aria-hidden="true" style="--visual-accent:' +
      palette.accent +
      ";--visual-soft:" +
      palette.soft +
      '">' +
      patterns[hash % patterns.length] +
      "</svg>"
    );
  }

  function resetMatchingState(questionKey) {
    matchingState = {
      questionKey: questionKey || "",
      selectedId: "",
      placements: {},
      sourceOrder: [],
      targetOrder: [],
    };
  }

  function matchingSourceIdForTarget(targetId) {
    const sourceIds = Object.keys(matchingState.placements);
    return (
      sourceIds.find(function (sourceId) {
        return matchingState.placements[sourceId] === targetId;
      }) || ""
    );
  }

  function placeMatchingItem(question, sourceId, targetId) {
    if (!sourceId || !targetId) return;
    const previousSource = matchingSourceIdForTarget(targetId);
    if (previousSource && previousSource !== sourceId) {
      delete matchingState.placements[previousSource];
    }
    matchingState.placements[sourceId] = targetId;
    matchingState.selectedId = "";
    renderMatchingQuestion(question);
  }

  function matchingQuestionKey(question) {
    return question.category + "::" + question.title;
  }

  function renderMatchingQuestion(question) {
    const optionWrap = document.getElementById("quiz-options");
    const key = matchingQuestionKey(question);
    if (matchingState.questionKey !== key) {
      resetMatchingState(key);
      matchingState.sourceOrder = shuffled(
        question.pairs.map(function (pair) {
          return pair.id;
        }),
      );
      matchingState.targetOrder = shuffled(
        question.pairs.map(function (pair) {
          return pair.id;
        }),
      );
    }

    optionWrap.className = "quiz-options is-matching";
    optionWrap.innerHTML =
      '<div class="matching-board">' +
      '<div class="matching-column matching-source-column">' +
      '<div class="matching-column-heading"><strong>拖动卡片</strong><span>也可以先点卡片，再点右侧目标</span></div>' +
      '<div class="matching-source-pool" id="matching-source-pool"></div>' +
      "</div>" +
      '<div class="matching-column matching-target-column">' +
      '<div class="matching-column-heading"><strong>匹配目标</strong><span>把概念放进正确的说明卡片</span></div>' +
      '<div class="matching-target-list" id="matching-target-list"></div>' +
      "</div>" +
      "</div>";

    const sourcePool = document.getElementById("matching-source-pool");
    const targetList = document.getElementById("matching-target-list");
    const pairMap = {};
    question.pairs.forEach(function (pair) {
      pairMap[pair.id] = pair;
    });

    matchingState.sourceOrder.forEach(function (sourceId) {
      if (matchingState.placements[sourceId]) return;
      const pair = pairMap[sourceId];
      const card = document.createElement("button");
      card.type = "button";
      card.className = "matching-source-card";
      if (matchingState.selectedId === sourceId) {
        card.classList.add("is-selected");
      }
      card.draggable = true;
      card.dataset.sourceId = sourceId;
      card.innerHTML =
        createMatchingVisual(pair.visual || pair.id) +
        '<span class="matching-card-label">' +
        pair.label +
        "</span>";
      card.addEventListener("click", function () {
        matchingState.selectedId =
          matchingState.selectedId === sourceId ? "" : sourceId;
        renderMatchingQuestion(question);
      });
      card.addEventListener("dragstart", function (event) {
        matchingState.selectedId = sourceId;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", sourceId);
        card.classList.add("is-dragging");
      });
      card.addEventListener("dragend", function () {
        card.classList.remove("is-dragging");
      });
      sourcePool.appendChild(card);
    });

    if (!sourcePool.children.length) {
      sourcePool.innerHTML =
        '<p class="matching-empty">所有卡片都已放置，可以提交检查。</p>';
    }

    matchingState.targetOrder.forEach(function (targetId) {
      const pair = pairMap[targetId];
      const placedSourceId = matchingSourceIdForTarget(targetId);
      const target = document.createElement("div");
      target.className = "matching-target-card";
      target.dataset.targetId = targetId;
      target.innerHTML =
        '<p class="matching-target-description"><span>' +
        String(matchingState.targetOrder.indexOf(targetId) + 1).padStart(2, "0") +
        "</span>" +
        pair.description +
        "</p>" +
        '<div class="matching-dropzone">' +
        (placedSourceId
          ? '<button class="matching-placed-card" type="button" data-remove-source="' +
            placedSourceId +
            '">' +
            createMatchingVisual(pairMap[placedSourceId].visual || placedSourceId) +
            "<span>" +
            pairMap[placedSourceId].label +
            '</span><b aria-hidden="true">×</b></button>'
          : '<span class="matching-drop-hint">拖到这里</span>') +
        "</div>";
      target.addEventListener("click", function (event) {
        const removeButton = event.target.closest("[data-remove-source]");
        if (removeButton) {
          delete matchingState.placements[removeButton.dataset.removeSource];
          matchingState.selectedId = "";
          renderMatchingQuestion(question);
          return;
        }
        if (matchingState.selectedId) {
          placeMatchingItem(question, matchingState.selectedId, targetId);
        }
      });
      target.addEventListener("dragover", function (event) {
        event.preventDefault();
        target.classList.add("is-dragover");
      });
      target.addEventListener("dragleave", function () {
        target.classList.remove("is-dragover");
      });
      target.addEventListener("drop", function (event) {
        event.preventDefault();
        target.classList.remove("is-dragover");
        placeMatchingItem(
          question,
          event.dataTransfer.getData("text/plain"),
          targetId,
        );
      });
      targetList.appendChild(target);
    });
  }

  function completeAnswer(question, userAnswer, isCorrect, feedback, message) {
    const panel = document.getElementById("quiz-panel");
    panel.dataset.answered = "true";
    if (isCorrect) {
      panel.dataset.score = String(Number(panel.dataset.score) + 1);
    }
    feedback.className =
      "quiz-feedback " + (isCorrect ? "is-correct" : "is-wrong");
    feedback.textContent = message;

    const records = storageGet(RECORDS_KEY);
    records.push({
      username: currentUsername(),
      type: question.type,
      title: question.title,
      category: question.category,
      difficulty: question.difficulty,
      answer: question.answer,
      userAnswer: userAnswer,
      correct: isCorrect,
      time: new Date().toISOString(),
    });
    storageSet(RECORDS_KEY, records);
    renderStats(records);
    window.dispatchEvent(
      new CustomEvent("ml-practice-result", {
        detail: {
          correct: isCorrect,
          question: question,
          score: Number(panel.dataset.score),
          total: activeQuestions.length,
        },
      }),
    );
    document.getElementById("quiz-submit").hidden = true;
    document.getElementById("quiz-next").hidden = false;
  }

  function submitMatchingAnswer(question, feedback) {
    const missing = question.pairs.filter(function (pair) {
      return !matchingState.placements[pair.id];
    });
    if (missing.length) {
      feedback.className = "quiz-feedback is-wrong";
      feedback.textContent =
        "还有 " + missing.length + " 张卡片没有放置，请全部匹配后再提交。";
      return;
    }

    const correctPairs = question.pairs.filter(function (pair) {
      return matchingState.placements[pair.id] === pair.id;
    });
    const isCorrect = correctPairs.length === question.pairs.length;
    const userAnswer = question.pairs
      .map(function (pair) {
        const matchedId = matchingState.placements[pair.id];
        return pair.label + "→" + (matchedId === pair.id ? "正确" : "错误");
      })
      .join("；");

    document.querySelectorAll(".matching-target-card").forEach(function (card) {
      const placedSourceId = matchingSourceIdForTarget(card.dataset.targetId);
      card.classList.add(
        placedSourceId === card.dataset.targetId ? "is-correct" : "is-wrong",
      );
      card.classList.add("is-locked");
    });
    document.querySelectorAll(".matching-source-card").forEach(function (card) {
      card.disabled = true;
    });

    const message =
      (isCorrect
        ? "全部匹配正确。"
        : "匹配完成，正确 " +
          correctPairs.length +
          "/" +
          question.pairs.length +
          " 对。正确答案：" +
          question.answer +
          "。") + question.explanation;
    completeAnswer(question, userAnswer, isCorrect, feedback, message);
  }

  function resetPractice() {
    const panel = document.getElementById("quiz-panel");
    if (panel) panel.hidden = true;
    const complete = document.getElementById("session-complete");
    if (complete) complete.hidden = true;
    activeQuestions = [];
    resetMatchingState("");
    const selectedType = document.getElementById("selected-type");
    const progress = document.getElementById("quiz-progress");
    if (selectedType && !document.body.dataset.practiceType) {
      selectedType.textContent = "请选择题型开始练习";
    }
    if (progress) progress.textContent = "";
  }

  function renderStats(records) {
    const list = userRecords(records);
    const correct = list.filter(function (record) {
      return record.correct;
    }).length;
    const done = document.getElementById("practice-done");
    const rate = document.getElementById("practice-correct");
    const recent = document.getElementById("practice-recent");
    const rescueCount = document.getElementById("practice-rescue-count");
    const username = currentUsername();
    const rescues = storageGet(RESCUE_KEY).filter(function (record) {
      return !record.username || record.username === username;
    });
    if (done) done.textContent = String(list.length);
    if (rate) {
      rate.textContent = list.length
        ? Math.round((correct / list.length) * 100) + "%"
        : "0%";
    }
    if (recent) {
      recent.textContent = list.length
        ? formatTime(list[list.length - 1].time)
        : "暂无";
    }
    if (rescueCount) rescueCount.textContent = String(rescues.length);
  }

  function formatTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("zh-CN");
  }

  function populateCategories() {
    const select = document.getElementById("practice-category");
    if (!select) return;
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
    const category = document.getElementById("practice-category").value;
    const mode = document.getElementById("practice-order").value;
    activeQuestions = orderQuestions(filterQuestions(type, category), mode);
    const panel = document.getElementById("quiz-panel");
    if (!panel) return;
    panel.hidden = false;
    const complete = document.getElementById("session-complete");
    if (complete) complete.hidden = true;

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
    window.dispatchEvent(
      new CustomEvent("ml-practice-start", {
        detail: {
          type: type,
          total: activeQuestions.length,
          category: category,
          mode: mode,
        },
      }),
    );
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderQuestion(question) {
    const panel = document.getElementById("quiz-panel");
    const index = Number(panel.dataset.index);
    const feedback = document.getElementById("quiz-feedback");
    const optionWrap = document.getElementById("quiz-options");
    const inputWrap = document.getElementById("quiz-input-wrap");

    feedback.className = "quiz-feedback";
    feedback.textContent = "";
    panel.dataset.answered = "false";
    document.getElementById("quiz-question").textContent = question.title;
    document.getElementById("quiz-meta").innerHTML =
      "<span>" +
      question.category +
      "</span><span>" +
      question.difficulty +
      "</span>";
    document.getElementById("quiz-progress").textContent =
      "第 " + (index + 1) + " / " + activeQuestions.length + " 题";
    optionWrap.innerHTML = "";
    optionWrap.className = "quiz-options";
    inputWrap.innerHTML = "";
    inputWrap.hidden = true;
    document.getElementById("quiz-submit").hidden = false;
    document.getElementById("quiz-next").hidden = true;
    document.getElementById("quiz-quit").hidden = false;
    document.getElementById("quiz-next").textContent =
      index === activeQuestions.length - 1 ? "完成任务" : "下一题";

    if (question.type === "配对题") {
      renderMatchingQuestion(question);
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
    } else {
      const input = document.createElement("input");
      input.className = "quiz-input";
      input.type = "text";
      input.placeholder = "请输入知识点名称或常用简称";
      input.id = "quiz-answer-input";
      inputWrap.appendChild(input);
      inputWrap.hidden = false;
    }

    window.dispatchEvent(
      new CustomEvent("ml-practice-question", {
        detail: {
          index: index,
          total: activeQuestions.length,
          question: question,
        },
      }),
    );
  }

  function submitAnswer() {
    const panel = document.getElementById("quiz-panel");
    if (panel.dataset.answered === "true") return;
    const question = activeQuestions[Number(panel.dataset.index)];
    const feedback = document.getElementById("quiz-feedback");
    let userAnswer = "";
    let isCorrect = false;

    if (question.type === "配对题") {
      submitMatchingAnswer(question, feedback);
      return;
    }

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
    }

    completeAnswer(
      question,
      userAnswer,
      isCorrect,
      feedback,
      (isCorrect
        ? "回答正确。"
        : "回答错误，正确答案是：" + question.answer + "。") +
        question.explanation,
    );
  }

  function nextQuestion() {
    const panel = document.getElementById("quiz-panel");
    let index = Number(panel.dataset.index) + 1;
    if (index >= activeQuestions.length) {
      if (document.body.dataset.practiceType) {
        finishPracticeSession();
        return;
      }
      index = 0;
    }
    panel.dataset.index = String(index);
    renderQuestion(activeQuestions[index]);
  }

  function finishPracticeSession() {
    const panel = document.getElementById("quiz-panel");
    const complete = document.getElementById("session-complete");
    const score = Number(panel.dataset.score);
    const total = activeQuestions.length;
    const rate = total ? Math.round((score / total) * 100) : 0;
    const successful = rate >= 70;
    panel.hidden = true;
    if (complete) {
      complete.hidden = false;
      complete.classList.toggle("is-success", successful);
      complete.classList.toggle("is-failure", !successful);
      const title = document.getElementById("session-complete-title");
      const message = document.getElementById("session-complete-message");
      if (title) {
        title.textContent = successful ? "救援成功" : "救援失败";
      }
      if (message) {
        message.textContent = successful
          ? "本次修复 " +
            score +
            " / " +
            total +
            " 个知识节点，正确率 " +
            rate +
            "%。核心已经恢复稳定。"
          : "本次修复 " +
            score +
            " / " +
            total +
            " 个知识节点，正确率 " +
            rate +
            "%。未达到 70%，核心尚未恢复稳定。";
      }
      complete.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.dispatchEvent(
      new CustomEvent("ml-practice-complete", {
        detail: {
          score: score,
          total: total,
        },
      }),
    );
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
    const submit = document.getElementById("quiz-submit");
    const next = document.getElementById("quiz-next");
    const quit = document.getElementById("quiz-quit");
    if (submit) submit.addEventListener("click", submitAnswer);
    if (next) next.addEventListener("click", nextQuestion);
    if (quit) quit.addEventListener("click", resetPractice);
  });
})();
