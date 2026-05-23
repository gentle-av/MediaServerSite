export class VolumeUI {
  update(volume, isMuted) {
    const displayVol = isMuted ? 0 : volume;
    const fill = document.getElementById("systemVolumeFill");
    const range = document.getElementById("systemVolumeRange");
    const value = document.getElementById("systemVolumeValue");
    const muteBtn = document.getElementById("systemVolumeMute");
    if (fill) fill.style.width = `${displayVol}%`;
    if (range) range.value = volume;
    if (value) value.textContent = isMuted ? "0%" : `${volume}%`;
    if (muteBtn) {
      const icon = muteBtn.querySelector("i");
      if (isMuted || volume === 0) {
        icon.className = "fas fa-volume-mute";
      } else if (volume < 30) {
        icon.className = "fas fa-volume-off";
      } else if (volume < 70) {
        icon.className = "fas fa-volume-down";
      } else {
        icon.className = "fas fa-volume-up";
      }
    }
  }
}
