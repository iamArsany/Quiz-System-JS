console.log("Testing the Main File");

//script to add teacher at the start
(() => {
  const users = JSON.parse(localStorage.getItem("users") || "[]");

  const userId = Date.now();
  const studentId = Date.now() + 10;
  const studentId2 = Date.now() + 20;

  const newUser = {
    id: userId,
    username: "Teacher",
    email: "t@g.com",
    password: "123123123Aa",
    mobile: "1234567890",
    grade: "3",
    Role: UserRole.Teacher,
  };
  const newStudent = {
    id: studentId,
    username: "student1",
    email: "st1@g.com",
    password: "123123123Aa",
    mobile: "1234567812",
    grade: "3",
    Role: UserRole.Student,
  };

  const newStudent2 = {
    id: studentId2,
    username: "student2",
    email: "st2@g.com",
    password: "123123123Aa",
    mobile: "1234567813",
    grade: "4",
    Role: UserRole.Student,
  };

  const exists = users.some((u) => u.email === newUser.email);
  if (exists) {
    console.warn("User with this email already exists");
    return;
  }

  users.push(newUser, newStudent, newStudent2);
  localStorage.setItem("users", JSON.stringify(users));

  console.log("Teacher :", newUser);
  console.log("student1 :", newStudent);
  console.log("student2 :", newStudent);
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
