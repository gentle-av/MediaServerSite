import { AudioPollingStrategy } from "./AudioPollingStrategy.js";
import { VideoPollingStrategy } from "./VideoPollingStrategy.js";

export class PollingStrategyFactory {
  static create(type, api, core, uiUpdater, progress, onStateChange) {
    switch (type) {
      case "audio":
        return new AudioPollingStrategy(
          api,
          core,
          uiUpdater,
          progress,
          onStateChange,
        );
      case "video":
        return new VideoPollingStrategy(
          api,
          core,
          uiUpdater,
          progress,
          onStateChange,
        );
      default:
        return null;
    }
  }

  static getType(core) {
    if (core.isAudio()) return "audio";
    if (core.isVideo()) return "video";
    return null;
  }
}
