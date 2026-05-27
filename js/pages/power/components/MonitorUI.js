export class MonitorUI {
  update(isOn) {
    const statusDot = document.querySelector("#monitorStatus .status-dot");
    const statusText = document.querySelector("#monitorStatus .status-text");
    const powerBtn = document.getElementById("monitorPowerBtn");

    if (statusDot) {
      if (isOn) {
        statusDot.classList.add("on");
      } else {
        statusDot.classList.remove("on");
      }
    }

    if (statusText) {
      statusText.textContent = isOn ? "Включен" : "Выключен";
    }

    if (powerBtn) {
      const icon = powerBtn.querySelector("i");
      if (icon) {
        if (isOn) {
          icon.className = "fas fa-desktop";
        } else {
          icon.className = "fas fa-desktop text-muted";
        }
      }
    }
  }

  setStatusText(text) {
    const statusText = document.querySelector("#monitorStatus .status-text");
    if (statusText) statusText.textContent = text;
  }

  setError() {
    const statusText = document.querySelector("#monitorStatus .status-text");
    if (statusText) statusText.textContent = "Ошибка подключения";
  }
}
