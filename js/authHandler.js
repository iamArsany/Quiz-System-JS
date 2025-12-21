const RegistrationHandler = async () => {
  const username = document.getElementById("reg-username").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  const mobile = document.getElementById("reg-mobile").value;
  const grade = document.getElementById("reg-grade").value;
  const avatarFile = document.getElementById("reg-avatar").files[0];

  const isvalidPass = IsValidPassword(password);
  const isvalidUser = IsValidUsername(username);
  const isvalidEmail = IsValidEmail(email);
  const isvalidMobile = IsValidMobile(mobile);
  const isvalidGrade = IsValidGrade(grade);
  const isvalidAvatar = IsValidAvatar(avatarFile);

  if (
    isvalidEmail &&
    isvalidUser &&
    isvalidPass &&
    isvalidMobile &&
    isvalidGrade &&
    isvalidAvatar
  ) {
    const userId = Date.now();

    await SaveImageToDB(userId, avatarFile);

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const newUser = {
      id: userId,
      username: username,
      email: email,
      password: password,
      mobile: mobile,
      grade: grade,
      Role: UserRole.Student,
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
      new PopupMsg("Login Successfully!", MsgType.Success);

      setTimeout(() => {
        console.log(user.Role);
        if (user.Role == UserRole.Student) {
          window.location.href = "home.html";
        } else {
          window.location.href = "dashboard.html";
        }
      }, 1500);
    } else {
      new PopupMsg("Error: Invalid email or password", MsgType.Error);
      console.log("here in the login in the else");
    }
  }
};

const IsValidMobile = (mobile) => {
  const mobileRegex = /^[0-9]{10,15}$/;
  if (!mobileRegex.test(mobile)) {
    new PopupMsg("Error: Invalid mobile number (10-15 digits)", MsgType.Error);
    return false;
  }
  return true;
};

const IsValidGrade = (grade) => {
  if (!grade) {
    new PopupMsg("Error: Please select a grade", MsgType.Error);
    return false;
  }
  return true;
};

const IsValidAvatar = (file) => {
  if (!file) {
    new PopupMsg("Error: Please upload a profile picture", MsgType.Error);
    return false;
  }
  return true;
};

const SaveImageToDB = (id, file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const request = indexedDB.open("UserAssets", 1);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("avatars")) {
          db.createObjectStore("avatars", { keyPath: "id" });
        }
      };

      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction("avatars", "readwrite");
        const store = tx.objectStore("avatars");

        store.put({ id: id, image: reader.result });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };

      request.onerror = () => reject(request.error);
    };

    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(file);
  });
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
