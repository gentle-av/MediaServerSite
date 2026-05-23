export class TVStatusUI {
  update(screenOn) {
    const statusDot = document.querySelector("#tvStatus .status-dot");
    const statusText = document.querySelector("#tvStatus .status-text");
    if (statusDot) {
      if (screenOn) {
        statusDot.classList.add("on");
      } else {
        statusDot.classList.remove("on");
      }
    }
    if (statusText) {
      statusText.textContent = screenOn ? "Включен" : "Выключен";
    }
  }

  setStatusText(text) {
    const statusText = document.querySelector("#tvStatus .status-text");
    if (statusText) statusText.textContent = text;
  }

  setError() {
    const statusText = document.querySelector("#tvStatus .status-text");
    if (statusText) statusText.textContent = "Ошибка подключения";
  }
}
