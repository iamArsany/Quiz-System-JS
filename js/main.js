console.log("Testing the Main File");

//script to add teacher
(() => {
  const users = JSON.parse(localStorage.getItem("users") || "[]");

  const userId = Date.now();

  const newUser = {
    id: userId,
    username: "Teacher",
    email: "t@g.com",
    password: "123123123Aa",
    mobile: "1234567890",
    grade: "3",
    Role: UserRole.Teacher,
  };

  // Prevent duplicate email
  const exists = users.some((u) => u.email === newUser.email);
  if (exists) {
    console.warn("User with this email already exists");
    return;
  }

  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  console.log("Teacher user added successfully:", newUser);
})();

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
