export class AudioStream {
  constructor(data) {
    this.streamIndex = data.stream_index;
    this.codecName = data.codec_name || "";
    this.language = data.language || "und";
    this.title = data.title || "";
    this.channels = data.channels || 0;
    this.isDefault = data.is_default || false;
    this.isForced = data.is_forced || false;
    this.isSelected = data.is_selected || false;
  }

  get displayName() {
    const parts = [];
    if (this.language && this.language !== "und") {
      parts.push(this._getLangName(this.language));
    }
    if (this.title) parts.push(this.title);
    if (this.channels > 0) parts.push(`${this.channels}ch`);
    return parts.join(" · ") || `Дорожка ${this.streamIndex}`;
  }

  _getLangName(code) {
    const map = { rus: "Русский", eng: "Английский", und: "Неизвестно" };
    return map[code] || code;
  }
}
