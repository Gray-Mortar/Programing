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

    if (!user) {
      nickname.textContent = "尚未登录";
      username.textContent = "请先登录后再查看个人信息";
      gender.textContent = "未填写";
      birthdate.textContent = "未填写";
      email.textContent = "未填写";
      createdAt.textContent = "未填写";
      logoutButton.hidden = true;
      return;
    }

    nickname.textContent = user.nickname || user.username;
    username.textContent = "用户名：" + user.username;
    gender.textContent = user.gender || "未填写";
    birthdate.textContent = user.birthdate || "未填写";
    email.textContent = user.email || "未填写";
    createdAt.textContent = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("zh-CN")
      : "未填写";

    logoutButton.hidden = false;
    fillLearningStatus(user);
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
    handleLogout();
  });
})();
