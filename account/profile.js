(function () {
  const RECORDS_KEY = "ml_practice_records";
  const KNN_RECORDS_KEY = "ml_knn_records";

  function storageGet(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
      return [];
    }
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value || "暂无记录";
    }
    return date.toLocaleDateString("zh-CN");
  }

  function fillLearningStatus(user) {
    const records = storageGet(RECORDS_KEY);
    const list = records.filter(function (record) {
      return !record.username || record.username === user.username;
    });
    const knnRecords = storageGet(KNN_RECORDS_KEY).filter(function (record) {
      return !record.username || record.username === user.username;
    });
    const done = list.length;
    const correct = list.filter(function (record) {
      return record.correct;
    }).length;
    const rate = done ? Math.round((correct / done) * 100) + "%" : "0%";
    const recent = list.length ? list[list.length - 1] : null;

    document.getElementById("profile-challenge-score").textContent = done
      ? done + " 题 · 正确率 " + rate
      : "暂无成绩";
    document.getElementById("profile-recent-learning").textContent = recent
      ? (recent.type || "互动练习") + " · " + formatDate(recent.time)
      : "暂无记录";
    document.getElementById("profile-experiment-record").textContent =
      knnRecords.length ? knnRecords.length + " 次 KNN 实验" : "暂无实验记录";
  }

  function fillProfile() {
    const user = window.MLAuth ? window.MLAuth.getCurrentUser() : null;

    const nickname = document.getElementById("profile-nickname");
    const username = document.getElementById("profile-username");
    const gender = document.getElementById("profile-gender");
    const birthdate = document.getElementById("profile-birthdate");
    const email = document.getElementById("profile-email");
    const createdAt = document.getElementById("profile-created-at");
    const logoutButton = document.getElementById("logout-button");
    const editButton = document.getElementById("edit-profile-button");
    const editPanel = document.getElementById("profile-edit-panel");

    if (!user) {
      nickname.textContent = "尚未登录";
      username.textContent = "请先登录后再查看个人信息";
      gender.textContent = "未填写";
      birthdate.textContent = "未填写";
      email.textContent = "未填写";
      createdAt.textContent = "未填写";
      logoutButton.hidden = true;
      if (editButton) editButton.hidden = true;
      if (editPanel) editPanel.hidden = true;
      return;
    }

    nickname.textContent = user.nickname || user.username;
    username.textContent = "用户名：" + user.username;
    gender.textContent =
      user.gender === "其他"
        ? "不愿透露"
        : user.gender || "未填写";
    birthdate.textContent = user.birthdate || "未填写";
    email.textContent = user.email || "未填写";
    createdAt.textContent = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("zh-CN")
      : "未填写";

    logoutButton.hidden = false;
    if (editButton) editButton.hidden = false;
    if (editPanel) editPanel.hidden = true;
    fillLearningStatus(user);
  }

  function setEditStatus(message, type) {
    const status = document.getElementById("profile-edit-status");
    if (!status) return;
    status.textContent = message;
    status.classList.remove("is-error", "is-success");
    if (type) status.classList.add(type);
  }

  function openEditPanel() {
    const user = window.MLAuth ? window.MLAuth.getCurrentUser() : null;
    const panel = document.getElementById("profile-edit-panel");
    if (!user || !panel) return;

    document.getElementById("edit-nickname").value = user.nickname || "";
    document.getElementById("edit-gender").value = ["男", "女", "不愿透露"].includes(
      user.gender,
    )
      ? user.gender
      : "不愿透露";
    document.getElementById("edit-birthdate").value = user.birthdate || "";
    document.getElementById("edit-email").value = user.email || "";
    setEditStatus("");
    panel.hidden = false;
    document.getElementById("edit-nickname").focus();
  }

  function closeEditPanel() {
    const panel = document.getElementById("profile-edit-panel");
    if (panel) panel.hidden = true;
    setEditStatus("");
  }

  function saveProfile() {
    const user = window.MLAuth ? window.MLAuth.getCurrentUser() : null;
    const panel = document.getElementById("profile-edit-panel");
    if (!user) {
      setEditStatus("请先登录后再保存基本信息", "is-error");
      return;
    }

    const nickname = document.getElementById("edit-nickname").value.trim();
    const gender = document.getElementById("edit-gender").value;
    const birthdate = document.getElementById("edit-birthdate").value;
    const email = document.getElementById("edit-email").value.trim();
    const emailInput = document.getElementById("edit-email");

    if (email && !emailInput.checkValidity()) {
      setEditStatus("请输入正确的邮箱地址", "is-error");
      return;
    }

    const users = window.MLAuth.getUsers();
    const target = users.find(function (item) {
      return item.username === user.username;
    });
    if (!target) {
      setEditStatus("当前账号不存在，请重新登录", "is-error");
      return;
    }

    target.nickname = nickname;
    target.gender = gender;
    target.birthdate = birthdate;
    target.email = email;
    window.MLAuth.saveUsers(users);

    if (panel) panel.hidden = true;
    fillProfile();
    setEditStatus("基本信息已保存，将随当前账号显示", "is-success");
  }

  function handleProfileEdit() {
    const editButton = document.getElementById("edit-profile-button");
    const saveButton = document.getElementById("save-profile-button");
    const cancelButton = document.getElementById("cancel-profile-button");
    const panel = document.getElementById("profile-edit-panel");
    if (!editButton || !saveButton || !cancelButton || !panel) return;

    editButton.addEventListener("click", function () {
      if (panel.hidden) {
        openEditPanel();
      } else {
        closeEditPanel();
      }
    });
    saveButton.addEventListener("click", saveProfile);
    cancelButton.addEventListener("click", closeEditPanel);
  }

  function handleLogout() {
    const logoutButton = document.getElementById("logout-button");
    if (!logoutButton) {
      return;
    }

    logoutButton.addEventListener("click", function () {
      window.MLAuth.setCurrentUser("");
      window.location.href = "../index.html";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillProfile();
    handleProfileEdit();
    handleLogout();
  });
})();
