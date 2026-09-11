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
  start: { message: "嗨！我是小 ML，你的学习伙伴。今天是第一次来，还是要继续学习？", options: [{ label: "我是新学员", value: "register" }, { label: "我已经有账号", value: "login" }] },
  registerName: { message: "太好了，欢迎加入！我该怎么称呼你？", placeholder: "例如：小明", field: "name" },
  registerEmail: { message: (data) => `认识你很高兴，${data.name}。留一个常用邮箱，方便保存你的学习进度吧。`, placeholder: "name@example.com", field: "email" },
  registerPassword: { message: "最后设置一个密码，至少 6 位字符就好。", placeholder: "输入密码", field: "password", password: true },
  registerConfirm: { message: "再输入一次密码，我帮你确认一下。", placeholder: "再次输入密码", field: "confirm", password: true },
  loginEmail: { message: "欢迎回来！先告诉我你的账号邮箱。", placeholder: "name@example.com", field: "email" },
  loginPassword: { message: "收到。现在输入你的密码，我们马上出发。", placeholder: "输入密码", field: "password", password: true, options: [{ label: "忘记密码", value: "forgotPassword" }] }
};

let currentStep = "start";
let data = {};

function addMessage(text, sender = "bot") {
  const item = document.createElement("div");
  item.className = `message ${sender}`;
  item.innerHTML = sender === "bot" ? `<span class="message-avatar">ML</span><p></p>` : `<p></p>`;
  item.querySelector("p").textContent = text;
  conversation.append(item);
  requestAnimationFrame(() => item.classList.add("is-visible"));
  conversation.scrollTop = conversation.scrollHeight;
}

function complete(type) {
  const name = data.name ? `，${data.name}` : "";
  const message = type === "register" ? `完成啦${name}！你的学习档案已经准备好了，欢迎来到 ML Learning Club。` : type === "reset" ? "没关系，我已经为你准备好密码重置入口了。请稍后查看邮箱。" : "登录成功，欢迎回来。你的学习进度正在等你继续。";
  addMessage(message);
  chatInput.disabled = true;
  chatInput.placeholder = "对话已完成";
  composerHint.textContent = "信息已提交";
  quickActions.replaceChildren();
  setTimeout(() => {
    learningOverlay.hidden = false;
    setTimeout(() => {
      loadingPanel.hidden = true;
      readyPanel.hidden = false;
    }, 2200);
  }, 500);
}

function renderOptions(options = []) {
  quickActions.replaceChildren();
  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option.label;
    button.addEventListener("click", () => receive(option.value, option.label));
    quickActions.append(button);
  });
}

function ask(stepName) {
  if (stepName === "completeRegister") return complete("register");
  if (stepName === "completeLogin") return complete("login");
  currentStep = stepName;
  const step = steps[stepName];
  const text = typeof step.message === "function" ? step.message(data) : step.message;
  addMessage(text);
  chatInput.placeholder = step.placeholder || "输入你的回答...";
  chatInput.type = step.password ? "password" : "text";
  composerHint.textContent = step.options ? "选择一个回答" : "输入回答后按 Enter";
  renderOptions(step.options);
  if (!step.options) setTimeout(() => chatInput.focus(), 120);
}

function receive(value, visibleText = value) {
  addMessage(visibleText, "user");
  chatInput.value = "";
  quickActions.replaceChildren();
  if (currentStep === "start") return ask(value === "register" ? "registerName" : "loginEmail");
  if (currentStep === "loginPassword" && value === "forgotPassword") return complete("reset");

  const field = steps[currentStep].field;
  data[field] = value.trim();
  const next = { registerName: "registerEmail", registerEmail: "registerPassword", registerPassword: "registerConfirm", registerConfirm: "completeRegister", loginEmail: "loginPassword", loginPassword: "completeLogin" }[currentStep];
  if (currentStep === "registerConfirm" && data.password !== data.confirm) {
    addMessage("两次密码还不一样，我们再试一次？");
    return ask("registerConfirm");
  }
  ask(next);
}

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (value && steps[currentStep]?.field) receive(value);
});

restartButton.addEventListener("click", () => {
  data = {};
  chatInput.disabled = false;
  conversation.replaceChildren();
  learningOverlay.hidden = true;
  loadingPanel.hidden = false;
  readyPanel.hidden = true;
  ask("start");
});

startLearning.addEventListener("click", () => {
  window.location.href = "../index.html";
});

ask("start");
