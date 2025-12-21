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

    // Bind username
    displayNameEl.innerText = user.username;

    // Initials fallback
    const initialsEl = document.getElementById("user-initials");
    initialsEl.innerText = user.username.charAt(0).toUpperCase();

    // Avatar
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

  // Trigger manually (since load doesn’t fire on divs)
  displayNameEl.dispatchEvent(new Event("load"));
}

const logout = () => {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
};
