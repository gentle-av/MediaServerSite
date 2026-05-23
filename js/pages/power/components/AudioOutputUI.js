export class AudioOutputUI {
  update(currentOutput) {
    const speakersBtn = document.getElementById("audioSpeakersBtn");
    const headphonesBtn = document.getElementById("audioHeadphonesBtn");
    if (speakersBtn) {
      if (currentOutput === "speakers") {
        speakersBtn.classList.add("active");
      } else {
        speakersBtn.classList.remove("active");
      }
    }
    if (headphonesBtn) {
      if (currentOutput === "headphones") {
        headphonesBtn.classList.add("active");
      } else {
        headphonesBtn.classList.remove("active");
      }
    }
  }
}
