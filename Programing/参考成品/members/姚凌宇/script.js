// 找到“联系我”按钮和联系方式弹窗
const openContactButton = document.querySelector("#OpenContactButton");
const contactDialog = document.querySelector("#contactDialog");

//关于我
const openAboutButton = document.querySelector("#OpenAboutButton");
const aboutDialog = document.querySelector("#aboutDialog");

// 点击“联系我”按钮时，打开模态弹窗
openContactButton.addEventListener("click", function () {
    contactDialog.showModal();
});

// 点击弹窗外的深色遮罩时，也可以关闭弹窗
contactDialog.addEventListener("click", function (event) {
    if (event.target === contactDialog) {
        contactDialog.close();
    }
});

openAboutButton.addEventListener("click", function () {
    aboutDialog.showModal();
});

aboutDialog.addEventListener("click", function (event) {
    if (event.target === aboutDialog) {
        aboutDialog.close();
    }
});

