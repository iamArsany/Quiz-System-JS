console.log("Testing the Main File");

const regBtn = document.getElementById("reg-submit");
const loginBtn = document.getElementById("login-submit");

if (regBtn) {
  regBtn.onclick = (e) => {
    console.log("register button");
    e.preventDefault();
    RegistrationHandler();
  };
}

if (loginBtn) {
  loginBtn.onclick = (e) => {
    console.log("login button");
    e.preventDefault();
    LoginHandler();
  };
}
