(function () {
  const USERS_KEY = "ml_users";
  const CURRENT_USER_KEY = "ml_current_user";

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (error) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getCurrentUser() {
    const username = localStorage.getItem(CURRENT_USER_KEY);
    if (!username) {
      return null;
    }
    return (
      getUsers().find(function (user) {
        return user.username === username;
      }) || null
    );
  }

  function setCurrentUser(username) {
    if (username) {
      localStorage.setItem(CURRENT_USER_KEY, username);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  window.MLAuth = {
    getUsers: getUsers,
    saveUsers: saveUsers,
    getCurrentUser: getCurrentUser,
    setCurrentUser: setCurrentUser,
    login: function (username, password) {
      const identifier = String(username || "").trim();
      const normalizedIdentifier = identifier.toLowerCase();
      const user = getUsers().find(function (item) {
        const matchesUsername = item.username === identifier;
        const matchesEmail =
          item.email && item.email.toLowerCase() === normalizedIdentifier;
        return (matchesUsername || matchesEmail) && item.password === password;
      });
      if (!user) {
        return { ok: false, message: "用户名或密码不正确。" };
      }
      setCurrentUser(user.username);
      return { ok: true, message: "登录成功。" };
    },
    register: function (data) {
      const users = getUsers();
      const normalizedEmail = String(data.email || "").trim().toLowerCase();
      const exists = users.some(function (item) {
        return (
          item.username === data.username ||
          (normalizedEmail &&
            item.email &&
            item.email.toLowerCase() === normalizedEmail)
        );
      });
      if (exists) {
        return { ok: false, message: "该用户名已被注册。" };
      }
      users.push({
        id: "user_" + Date.now(),
        username: data.username,
        password: data.password,
        nickname: data.nickname || "",
        gender: data.gender || "",
        birthdate: data.birthdate || "",
        email: data.email || "",
        createdAt: new Date().toISOString(),
      });
      saveUsers(users);
      return { ok: true, message: "注册成功，请登录。" };
    },
  };

  window.MLAuth.getCurrentUser = getCurrentUser;
})();
