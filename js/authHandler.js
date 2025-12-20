const RegistrationHandler = () => {
  const username = document.getElementById("reg-username").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  const isvalidPass = IsValidPassword(password);
  const isvalidUser = IsValidUsername(username);
  const isvalidEmail = IsValidEmail(email);

  if (isvalidEmail && isvalidUser && isvalidPass) {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    console.log("users", users);
    console.log("users", users);
    const newUser = {
      id: Date.now(),
      username: username,
      email: email,
      password: password,
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    new PopupMsg("Success: Registration is Successful!", MsgType.Success);

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  }
};

const LoginHandler = () => {
  const email = document.getElementById("log-email").value;
  const password = document.getElementById("log-password").value;

  const isvalidEmail = IsValidEmail(email);
  const isvalidPass = IsValidPassword(password);

  if (isvalidEmail && isvalidPass) {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find(
      (u) => u.email === email && u.password === password,
    );

    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));

      setTimeout(() => {
        window.location.href = "home.html";
        console.log("here in the login handler timeout ");
        new PopupMsg("Login Successfully!", MsgType.Success);
      }, 1500);
    } else {
      // new PopupMsg("Error: Invalid email or password", MsgType.Error);
      console.log("here in the login in the else");
    }
  }
};

const IsValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    new PopupMsg("Error in Email format", MsgType.Error);
    return false;
  }
  return true;
};

const IsValidUsername = (username) => {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const userExists = users.some((u) => u.username === username);

  if (username.length < 3) {
    new PopupMsg("Error: Username too short", MsgType.Error);
    return false;
  }

  if (userExists) {
    new PopupMsg("Error: username already exists!", MsgType.Error);
    return false;
  }
  return true;
};

const IsValidPassword = (password) => {
  const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passRegex.test(password)) {
    new PopupMsg(
      "Error: Password must be 8 chars, 1 Capital, 1 Small, 1 Number",
      MsgType.Error,
    );
    return false;
  }
  return true;
};
