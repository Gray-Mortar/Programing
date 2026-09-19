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
      return (
        !record.username ||
        record.username === user.username ||
        record.username === "guest"
      );
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

    const experimentLink = document.getElementById("profile-experiment-link");
    if (experimentLink && knnRecords.length) {
      const latestRecord = knnRecords[knnRecords.length - 1];
      experimentLink.href =
        "../experiments/knn-iris/history.html?time=" +
        encodeURIComponent(latestRecord.time);
      experimentLink.textContent = "查看最近记录";
    } else if (experimentLink) {
      experimentLink.href = "../experiments/knn-iris/index.html";
      experimentLink.textContent = "开始实验";
    }
  }

  function fillProfile() {
    const user = window.MLAuth ? window.MLAuth.getCurrentUser() : null;

    const nickname = document.getElementById("profile-nickname");
    const username = document.getElementById("profile-username");
    const logoutButton = document.getElementById("logout-button");

    if (!user) {
      nickname.textContent = "尚未登录";
      username.textContent = "请先登录后再查看个人信息";
      username.hidden = false;
      logoutButton.hidden = true;
      return;
    }

    nickname.textContent = user.username;
    username.textContent = "";
    username.hidden = true;

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
      window.location.replace("index1.html");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillProfile();
    handleLogout();
  });
})();
