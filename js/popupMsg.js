class PopupMsg {
  static #activePopups = 0;
  static #gap = 12;
  static #PopupList = [];

  constructor(Msg, Type, Time = 3000) {
    this.Time = Time;

    switch (Type) {
      case MsgType.Hint:
        this.hintPopup(Msg);
        break;
      case MsgType.Success:
        this.successPopup(Msg);
        break;
      case MsgType.Error:
        this.errorPopup(Msg);
        break;
      default:
        this.errorPopup("Error in the Popup System");
        break;
    }
  }

  hintPopup(Msg) {
    this.InitPopup(Msg, "bg-blue-600");
  }

  successPopup(Msg) {
    this.InitPopup(Msg, "bg-green-600");
  }

  errorPopup(Msg) {
    this.InitPopup(Msg, "bg-red-700");
  }

  InitPopup(Msg, color) {
    const popupHeight = 30;
    const offset = PopupMsg.#activePopups * (popupHeight + PopupMsg.#gap);
    PopupMsg.#activePopups++;

    const popup = document.createElement("div");

    popup.className = `
      fixed top-4 right-4 z-50
      ${color} text-white
      px-4 py-3 rounded-lg shadow-lg
      transition-all duration-300
    `;
    popup.style.transform = `translateY(${offset + 20}px)`;
    popup.innerText = Msg;
    document.body.appendChild(popup);
    PopupMsg.#PopupList.push(popup);

    requestAnimationFrame(() => {
      popup.classList.add("opacity-100");
    });

    setTimeout(() => {
      popup.classList.remove("opacity-100");
      popup.classList.add("opacity-0");
      popup.style.transform = `translateY(${offset - 20}px)`;

      setTimeout(() => {
        const index = PopupMsg.#PopupList.indexOf(popup);
        if (index > -1) {
          PopupMsg.#PopupList.splice(index, 1);
          PopupMsg.#PopupList.forEach((p, i) => {
            const newOffset = i * (popupHeight + PopupMsg.#gap);
            p.style.transform = `translateY(${newOffset}px)`;
          });
        }
        popup.remove();
        PopupMsg.#activePopups = Math.max(0, PopupMsg.#activePopups - 1);
      }, 300);
    }, this.Time);
  }
}
