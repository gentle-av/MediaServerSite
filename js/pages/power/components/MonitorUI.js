export class MonitorUI {
  update(isIdle, isOn) {
    console.log(`MonitorUI update: isIdle=${isIdle}, isOn=${isOn}`);
    const statusDot = document.querySelector("#monitorStatus .status-dot");
    const statusText = document.querySelector("#monitorStatus .status-text");
    if (statusDot) {
      statusDot.classList.remove("on", "idle", "off");
      if (!isOn) {
        statusDot.classList.add("off");
        if (statusText) statusText.textContent = "Выключен";
      } else if (isIdle) {
        statusDot.classList.add("idle");
        if (statusText) statusText.textContent = "Ожидание";
      } else {
        statusDot.classList.add("on");
        if (statusText) statusText.textContent = "Активен";
      }
    }
  }

  setStatusText(text) {
    const statusText = document.querySelector("#monitorStatus .status-text");
    if (statusText) statusText.textContent = text;
  }

  setError() {
    const statusText = document.querySelector("#monitorStatus .status-text");
    const statusDot = document.querySelector("#monitorStatus .status-dot");
    if (statusText) statusText.textContent = "Ошибка";
    if (statusDot) {
      statusDot.classList.remove("on", "idle", "off");
    }
  }
}
