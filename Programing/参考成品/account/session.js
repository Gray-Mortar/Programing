(function () {
    function renderHeaderState() {
        const loginButton = document.getElementById("login-button");
        const registerButton = document.getElementById("register-button");
        const accountUser = document.getElementById("account-user");
        const backHomeButton = document.getElementById("back-home-button");

        if (backHomeButton) {
            if (loginButton) {
                loginButton.hidden = true;
            }
            if (registerButton) {
                registerButton.hidden = true;
            }
            if (accountUser) {
                accountUser.hidden = true;
            }
            backHomeButton.hidden = false;
            return;
        }

        if (!loginButton || !registerButton || !accountUser) {
            return;
        }

        const user = window.MLAuth ? window.MLAuth.getCurrentUser() : null;

        if (user) {
            loginButton.hidden = true;
            registerButton.hidden = true;
            accountUser.hidden = false;
            accountUser.textContent = user.username || "我的账号";
            accountUser.href = accountUser.getAttribute("data-profile-href") || accountUser.getAttribute("href");
        } else {
            loginButton.hidden = false;
            registerButton.hidden = false;
            accountUser.hidden = true;
            accountUser.textContent = "";
            if (backHomeButton) {
                backHomeButton.hidden = true;
            }
        }
    }

    document.addEventListener("DOMContentLoaded", renderHeaderState);
})();
