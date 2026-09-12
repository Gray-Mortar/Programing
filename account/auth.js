(function () {
  const USERS_KEY = "ml_users";
  const CURRENT_USER_KEY = "ml_current_user";

  function getUsers() {
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
      const sanitizedUsers = users.map(function (user) {
        const account = Object.assign({}, user);
        delete account.email;
        delete account.nickname;
        return account;
      });
      if (JSON.stringify(users) !== JSON.stringify(sanitizedUsers)) {
        localStorage.setItem(USERS_KEY, JSON.stringify(sanitizedUsers));
      }
      return sanitizedUsers;
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
      const user = getUsers().find(function (item) {
        return item.username === identifier && item.password === password;
      });
      if (!user) {
        return { ok: false, message: "用户名或密码不正确。" };
      }
      setCurrentUser(user.username);
      return { ok: true, message: "登录成功。" };
    },
    register: function (data) {
      const users = getUsers();
      const username = String(data.username || "").trim();
      const password = String(data.password || "");
      if (!username) {
        return { ok: false, message: "请输入用户名。" };
      }
      if (!/^[A-Za-z0-9]{6,}$/.test(password)) {
        return {
          ok: false,
          message: "密码至少需要 6 位，并且只能包含数字或英文字母。",
        };
      }
      const exists = users.some(function (item) {
        return item.username === username;
      });
      if (exists) {
        return { ok: false, message: "该用户名已被注册。" };
      }
      users.push({
        id: "user_" + Date.now(),
        username: username,
        password: password,
        gender: data.gender || "",
        birthdate: data.birthdate || "",
        createdAt: new Date().toISOString(),
      });
      saveUsers(users);
      return { ok: true, message: "注册成功，请登录。" };
    },
  };

  window.MLAuth.getCurrentUser = getCurrentUser;
})();
