(function () {
    const RECORDS_KEY = "ml_practice_records";

    const questionBank = window.ML_QUESTIONS || { judge: [], choice: [], fill: [] };

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

    function resetPractice() {
        const panel = document.getElementById("quiz-panel");
        panel.hidden = true;
        document.getElementById("selected-type").textContent = "请选择题型开始练习";
        document.getElementById("quiz-progress").textContent = "";
    }

    function renderStats(records) {
        const list = userRecords(records);
        const done = list.length;
        const correct = list.filter(function (record) {
            return record.correct;
        }).length;
        const rate = done ? Math.round((correct / done) * 100) + "%" : "0%";
        const recent = list.length ? formatTime(list[list.length - 1].time) : "暂无";

        document.getElementById("practice-done").textContent = String(done);
        document.getElementById("practice-correct").textContent = rate;
        document.getElementById("practice-recent").textContent = recent;
    }

    function formatTime(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }
        return date.toLocaleDateString("zh-CN");
    }

    function startQuiz(type) {
        const panel = document.getElementById("quiz-panel");
        const questions = questionBank[type] || [];
        if (!questions.length) {
            return;
        }

        panel.hidden = false;
        panel.dataset.type = type;
        panel.dataset.index = "0";
        panel.dataset.score = "0";
        panel.dataset.done = "0";
        panel.dataset.answered = "false";
        document.getElementById("selected-type").textContent = questions[0].type;
        document.getElementById("quiz-progress").textContent = "第 1 / " + questions.length + " 题";
        renderQuestion(questions[0]);
    }

    function renderQuestion(question) {
        const panel = document.getElementById("quiz-panel");
        const type = panel.dataset.type;
        const index = Number(panel.dataset.index);
        const questions = questionBank[type];
        const feedback = document.getElementById("quiz-feedback");

        feedback.className = "quiz-feedback";
        feedback.textContent = "";
        panel.dataset.answered = "false";
        document.getElementById("quiz-question").textContent = question.title;

        const optionWrap = document.getElementById("quiz-options");
        const inputWrap = document.getElementById("quiz-input-wrap");
        const submit = document.getElementById("quiz-submit");

        optionWrap.innerHTML = "";
        inputWrap.hidden = true;
        submit.hidden = false;
        submit.textContent = "提交答案";
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
                        item.classList.remove("is-correct", "is-wrong");
                        item.disabled = false;
                    });
                    button.classList.add("is-correct");
                    button.dataset.selected = "true";
                });
                optionWrap.appendChild(button);
            });
        } else {
            const input = document.createElement("input");
            input.className = "quiz-input";
            input.type = "text";
            input.placeholder = "请输入答案";
            input.id = "quiz-answer-input";
            inputWrap.appendChild(input);
            inputWrap.hidden = false;
        }

        document.getElementById("quiz-progress").textContent = "第 " + (index + 1) + " / " + questions.length + " 题";
    }

    function submitAnswer() {
        const panel = document.getElementById("quiz-panel");
        if (panel.dataset.answered === "true") {
            return;
        }

        const type = panel.dataset.type;
        const questions = questionBank[type];
        const index = Number(panel.dataset.index);
        const question = questions[index];
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
                if (item.dataset.value === question.answer) {
                    item.classList.remove("is-wrong");
                    item.classList.add("is-correct");
                } else if (item.dataset.selected === "true") {
                    item.classList.remove("is-correct");
                    item.classList.add("is-wrong");
                }
            });
        } else {
            const input = document.getElementById("quiz-answer-input");
            userAnswer = input.value.trim();
            if (!userAnswer) {
                feedback.className = "quiz-feedback is-wrong";
                feedback.textContent = "请填写答案。";
                return;
            }
            isCorrect = userAnswer === question.answer;
            input.disabled = true;
        }

        panel.dataset.answered = "true";
        if (isCorrect) {
            panel.dataset.score = String(Number(panel.dataset.score) + 1);
        }
        panel.dataset.done = String(Number(panel.dataset.done) + 1);

        feedback.className = "quiz-feedback " + (isCorrect ? "is-correct" : "is-wrong");
        feedback.textContent = (isCorrect ? "回答正确。" : "回答错误，正确答案是：" + question.answer) + " " + question.explanation;

        const records = storageGet(RECORDS_KEY);
        records.push({
            username: currentUsername(),
            type: question.type,
            title: question.title,
            answer: question.answer,
            userAnswer: userAnswer,
            correct: isCorrect,
            time: new Date().toISOString()
        });
        storageSet(RECORDS_KEY, records);
        renderStats(records);

        document.getElementById("quiz-submit").hidden = true;
        document.getElementById("quiz-next").hidden = false;
    }

    function nextQuestion() {
        const panel = document.getElementById("quiz-panel");
        const type = panel.dataset.type;
        const questions = questionBank[type];
        let index = Number(panel.dataset.index) + 1;

        if (index >= questions.length) {
            index = 0;
        }
        panel.dataset.index = String(index);
        document.getElementById("quiz-submit").hidden = false;
        document.getElementById("quiz-next").hidden = true;
        renderQuestion(questions[index]);
    }

    document.addEventListener("DOMContentLoaded", function () {
        const records = storageGet(RECORDS_KEY);
        renderStats(records);
        resetPractice();

        document.querySelectorAll("[data-start-quiz]").forEach(function (button) {
            button.addEventListener("click", function () {
                startQuiz(button.dataset.startQuiz);
            });
        });

        document.getElementById("quiz-submit").addEventListener("click", submitAnswer);
        document.getElementById("quiz-next").addEventListener("click", nextQuestion);
        document.getElementById("quiz-quit").addEventListener("click", resetPractice);
    });
})();
