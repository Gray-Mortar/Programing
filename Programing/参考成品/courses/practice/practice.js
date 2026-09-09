(function () {
    const RECORDS_KEY = "ml_practice_records";
    const questionBank = window.ML_QUESTIONS || { judge: [], choice: [], fill: [] };
    let activeQuestions = [];

    function storageGet(key) {
        try { return JSON.parse(localStorage.getItem(key)) || []; } catch (error) { return []; }
    }

    function storageSet(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

    function currentUsername() {
        const user = window.MLAuth ? window.MLAuth.getCurrentUser() : null;
        return user ? user.username : "guest";
    }

    function userRecords(records) {
        const username = currentUsername();
        return records.filter(function (record) { return !record.username || record.username === username; });
    }

    function normalizeAnswer(value) {
        return String(value || "").trim().toLowerCase().replace(/[\s，,。.!！?？、（）()\-—_]/g, "");
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
        document.getElementById("quiz-panel").hidden = true;
        activeQuestions = [];
        document.getElementById("selected-type").textContent = "请选择题型开始练习";
        document.getElementById("quiz-progress").textContent = "";
    }

    function renderStats(records) {
        const list = userRecords(records);
        const correct = list.filter(function (record) { return record.correct; }).length;
        document.getElementById("practice-done").textContent = String(list.length);
        document.getElementById("practice-correct").textContent = list.length ? Math.round((correct / list.length) * 100) + "%" : "0%";
        document.getElementById("practice-recent").textContent = list.length ? formatTime(list[list.length - 1].time) : "暂无";
    }

    function formatTime(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("zh-CN");
    }

    function populateCategories() {
        const select = document.getElementById("practice-category");
        const categories = [];
        Object.keys(questionBank).forEach(function (type) {
            questionBank[type].forEach(function (question) {
                if (categories.indexOf(question.category) === -1) categories.push(question.category);
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
        panel.hidden = false;

        if (!activeQuestions.length) {
            document.getElementById("selected-type").textContent = "暂无匹配题目";
            document.getElementById("quiz-question").textContent = "当前章节下没有这种题型，请更换章节或题型。";
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
        document.getElementById("selected-type").textContent = activeQuestions[0].type;
        renderQuestion(activeQuestions[0]);
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
        document.getElementById("quiz-meta").innerHTML = "<span>" + question.category + "</span><span>" + question.difficulty + "</span>";
        document.getElementById("quiz-progress").textContent = "第 " + (index + 1) + " / " + activeQuestions.length + " 题";
        optionWrap.innerHTML = "";
        inputWrap.innerHTML = "";
        inputWrap.hidden = true;
        document.getElementById("quiz-submit").hidden = false;
        document.getElementById("quiz-next").hidden = true;
        document.getElementById("quiz-quit").hidden = false;

        if (question.options.length) {
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
    }

    function submitAnswer() {
        const panel = document.getElementById("quiz-panel");
        if (panel.dataset.answered === "true") return;
        const question = activeQuestions[Number(panel.dataset.index)];
        const feedback = document.getElementById("quiz-feedback");
        let userAnswer = "";
        let isCorrect = false;

        if (question.options.length) {
            const selected = document.querySelector(".quiz-option[data-selected='true']");
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
                if (item.dataset.value === question.answer) item.classList.add("is-correct");
                else if (item.dataset.selected === "true") item.classList.add("is-wrong");
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

        panel.dataset.answered = "true";
        if (isCorrect) panel.dataset.score = String(Number(panel.dataset.score) + 1);
        feedback.className = "quiz-feedback " + (isCorrect ? "is-correct" : "is-wrong");
        feedback.textContent = (isCorrect ? "回答正确。" : "回答错误，正确答案是：" + question.answer + "。") + question.explanation;

        const records = storageGet(RECORDS_KEY);
        records.push({
            username: currentUsername(), type: question.type, title: question.title,
            category: question.category, difficulty: question.difficulty,
            answer: question.answer, userAnswer: userAnswer, correct: isCorrect,
            time: new Date().toISOString()
        });
        storageSet(RECORDS_KEY, records);
        renderStats(records);
        document.getElementById("quiz-submit").hidden = true;
        document.getElementById("quiz-next").hidden = false;
    }

    function nextQuestion() {
        const panel = document.getElementById("quiz-panel");
        let index = Number(panel.dataset.index) + 1;
        if (index >= activeQuestions.length) index = 0;
        panel.dataset.index = String(index);
        renderQuestion(activeQuestions[index]);
    }

    window.MLPracticeHelpers = { normalizeAnswer: normalizeAnswer, filterQuestions: filterQuestions, orderQuestions: orderQuestions };

    document.addEventListener("DOMContentLoaded", function () {
        renderStats(storageGet(RECORDS_KEY));
        populateCategories();
        resetPractice();
        document.querySelectorAll("[data-start-quiz]").forEach(function (button) {
            button.addEventListener("click", function () { startQuiz(button.dataset.startQuiz); });
        });
        document.getElementById("quiz-submit").addEventListener("click", submitAnswer);
        document.getElementById("quiz-next").addEventListener("click", nextQuestion);
        document.getElementById("quiz-quit").addEventListener("click", resetPractice);
    });
})();
