(function () {
  "use strict";

  const conversation = document.querySelector("#conversation");
  const authForm = document.querySelector("#authForm");
  const chatInput = document.querySelector("#chatInput");
  const quickActions = document.querySelector("#quickActions");
  const composerHint = document.querySelector("#composerHint");
  const restartButton = document.querySelector("#restartButton");
  const learningOverlay = document.querySelector("#learningOverlay");
  const loadingPanel = document.querySelector("#loadingPanel");
  const readyPanel = document.querySelector("#readyPanel");
  const startLearning = document.querySelector("#startLearning");

  const steps = {
    start: {
      message:
        "嗨！我是小 ML，你的学习伙伴。今天是第一次来，还是要继续学习？",
      options: [
        { label: "我是新学员", value: "register" },
        { label: "我已经有账号", value: "login" },
      ],
    },
    registerName: {
      message: "太好了，欢迎加入！我该怎么称呼你？",
      placeholder: "例如：小明",
      field: "name",
      autocomplete: "name",
    },
    registerEmail: {
      message: function (values) {
        return (
          "认识你很高兴，" +
          values.name +
          "。留一个常用邮箱，它也会作为你的登录账号。"
        );
      },
      placeholder: "name@example.com",
      field: "email",
      autocomplete: "email",
    },
    registerPassword: {
      message: "最后设置一个密码，至少 6 位字符。",
      placeholder: "输入密码",
      field: "password",
      password: true,
      autocomplete: "new-password",
    },
    registerConfirm: {
      message: "再输入一次密码，我帮你确认。",
      placeholder: "再次输入密码",
      field: "confirm",
      password: true,
      autocomplete: "new-password",
    },
    loginIdentifier: {
      message: "欢迎回来！请输入用户名或注册邮箱。",
      placeholder: "用户名或邮箱",
      field: "identifier",
      autocomplete: "username",
    },
    loginPassword: {
      message: "收到。现在输入密码，我们马上出发。",
      placeholder: "输入密码",
      field: "password",
      password: true,
      autocomplete: "current-password",
    },
  };

  let currentStep = "start";
  let values = {};

  function addMessage(text, sender) {
    const source = sender || "bot";
    const item = document.createElement("div");
    item.className = "message " + source;
    item.innerHTML =
      source === "bot"
        ? '<span class="message-avatar">ML</span><p></p>'
        : "<p></p>";
    item.querySelector("p").textContent = text;
    conversation.appendChild(item);
    window.requestAnimationFrame(function () {
      item.classList.add("is-visible");
    });
    conversation.scrollTop = conversation.scrollHeight;
  }

  function renderOptions(options) {
    quickActions.replaceChildren();
    (options || []).forEach(function (option) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = option.label;
      button.addEventListener("click", function () {
        receive(option.value, option.label);
      });
      quickActions.appendChild(button);
    });
  }

  function showError(message) {
    addMessage(message);
    composerHint.textContent = "请修改后重新输入";
    window.setTimeout(function () {
      chatInput.focus();
      chatInput.select();
    }, 80);
  }

  function complete(type) {
    const suffix = values.name ? "，" + values.name : "";
    addMessage(
      type === "register"
        ? "完成啦" + suffix + "！账号已经创建并登录。"
        : "登录成功，欢迎回来。你的学习进度正在等你继续。",
    );
    chatInput.disabled = true;
    chatInput.placeholder = "对话已完成";
    composerHint.textContent = "账号验证成功";
    quickActions.replaceChildren();
    window.setTimeout(function () {
      learningOverlay.hidden = false;
      window.setTimeout(function () {
        loadingPanel.hidden = true;
        readyPanel.hidden = false;
      }, 900);
    }, 350);
  }

  function ask(stepName) {
    currentStep = stepName;
    const step = steps[stepName];
    const text =
      typeof step.message === "function" ? step.message(values) : step.message;
    addMessage(text);
    chatInput.placeholder = step.placeholder || "输入你的回答...";
    chatInput.type = step.password ? "password" : "text";
    chatInput.autocomplete = step.autocomplete || "off";
    composerHint.textContent = step.options
      ? "选择一个回答"
      : "输入回答后按 Enter";
    renderOptions(step.options);
    if (!step.options) {
      window.setTimeout(function () {
        chatInput.focus();
      }, 120);
    }
  }

  function registerAccount() {
    const username = values.email.toLowerCase();
    const result = window.MLAuth.register({
      username: username,
      password: values.password,
      nickname: values.name,
      email: username,
    });
    if (!result.ok) {
      values.email = "";
      showError(result.message + " 请换一个邮箱。");
      ask("registerEmail");
      return;
    }

    const loginResult = window.MLAuth.login(username, values.password);
    if (!loginResult.ok) {
      showError("账号已创建，但自动登录失败。请重新开始并选择登录。");
      return;
    }
    complete("register");
  }

  function submitField(value) {
    if (currentStep === "registerName") {
      values.name = value;
      ask("registerEmail");
      return;
    }

    if (currentStep === "registerEmail") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        showError("这个邮箱格式似乎不完整，请检查后再输入。");
        return;
      }
      values.email = value;
      ask("registerPassword");
      return;
    }

    if (currentStep === "registerPassword") {
      if (value.length < 6) {
        showError("密码至少需要 6 位字符，请重新设置。");
        return;
      }
      values.password = value;
      ask("registerConfirm");
      return;
    }

    if (currentStep === "registerConfirm") {
      if (value !== values.password) {
        showError("两次密码不一致，请重新确认。");
        return;
      }
      values.confirm = value;
      registerAccount();
      return;
    }

    if (currentStep === "loginIdentifier") {
      values.identifier = value;
      ask("loginPassword");
      return;
    }

    if (currentStep === "loginPassword") {
      const result = window.MLAuth.login(values.identifier, value);
      if (!result.ok) {
        showError(result.message + " 请重新输入密码，或重新开始更换账号。");
        return;
      }
      complete("login");
    }
  }

  function receive(value, visibleText) {
    if (currentStep === "start") {
      addMessage(visibleText || value, "user");
      chatInput.value = "";
      quickActions.replaceChildren();
      ask(value === "register" ? "registerName" : "loginIdentifier");
      return;
    }

    const step = steps[currentStep];
    const shownValue = step.password ? "••••••" : visibleText || value;
    addMessage(shownValue, "user");
    chatInput.value = "";
    quickActions.replaceChildren();
    submitField(String(value).trim());
  }

  authForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const value = chatInput.value.trim();
    if (!value || !steps[currentStep] || !steps[currentStep].field) {
      return;
    }
    receive(value);
  });

  restartButton.addEventListener("click", function () {
    values = {};
    chatInput.disabled = false;
    chatInput.value = "";
    conversation.replaceChildren();
    learningOverlay.hidden = true;
    loadingPanel.hidden = false;
    readyPanel.hidden = true;
    ask("start");
  });

  startLearning.addEventListener("click", function () {
    window.location.replace("../index.html");
  });

  if (!window.MLAuth) {
    addMessage("账号模块加载失败，请刷新页面后重试。");
    chatInput.disabled = true;
    return;
  }

  ask("start");
})();
