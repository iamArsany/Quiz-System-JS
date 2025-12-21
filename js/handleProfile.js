const RetrieveImageFromDB = (userId) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("UserAssets", 4);

    request.onsuccess = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains("avatars")) {
        resolve(null);
        return;
      }

      const tx = db.transaction("avatars", "readonly");
      const store = tx.objectStore("avatars");
      const getReq = store.get(userId);

      getReq.onsuccess = () => {
        resolve(getReq.result ? getReq.result.image : null);
      };

      getReq.onerror = () => reject(getReq.error);
    };

    request.onerror = () => reject(request.error);
  });
};

const displayNameEl = document.getElementById("display-name");

if (displayNameEl) {
  displayNameEl.addEventListener("load", async () => {
    const userStr = localStorage.getItem("currentUser");

    if (!userStr) {
      window.location.href = "login.html";
      return;
    }

    const user = JSON.parse(userStr);
    displayNameEl.innerText = user.username;

    const initialsEl = document.getElementById("user-initials");
    initialsEl.innerText = user.username.charAt(0).toUpperCase();

    const avatarImg = document.getElementById("user-avatar");

    try {
      const avatarBase64 = await RetrieveImageFromDB(user.id);

      if (avatarBase64) {
        avatarImg.src = avatarBase64;
        avatarImg.classList.remove("hidden");
        initialsEl.classList.add("hidden");
      }
    } catch (err) {
      console.error("Avatar load failed", err);
    }
  });

  displayNameEl.dispatchEvent(new Event("load"));
}

const logout = () => {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
};
