#!/bin/zsh

# TypeScript Project Structure Creator
# Usage: zsh create-ts-structure.zsh [project-name]

set -e

# Colors
autoload colors
colors

PROJECT_NAME=${1:-"media-center"}
PROJECT_ROOT="$PWD/$PROJECT_NAME"

echo "${fg[cyan]}🚀 Creating TypeScript project structure...${reset_color}"
echo "${fg[blue]}📁 Project: $PROJECT_NAME${reset_color}"
echo ""

# Function to create file
create_file() {
    local file_path="$1"
    mkdir -p "$(dirname "$file_path")"
    touch "$file_path"
    echo "  ✓ ${file_path#$PROJECT_ROOT/}"
}

# Create root config files
create_root_configs() {
    echo "${fg[yellow]}📝 Creating root configuration files...${reset_color}"

    create_file "$PROJECT_ROOT/package.json"
    create_file "$PROJECT_ROOT/tsconfig.json"
    create_file "$PROJECT_ROOT/vite.config.ts"
    create_file "$PROJECT_ROOT/.eslintrc.json"
    create_file "$PROJECT_ROOT/.prettierrc"
    create_file "$PROJECT_ROOT/.gitignore"
    create_file "$PROJECT_ROOT/index.html"
}

# Create TypeScript source structure
create_ts_structure() {
    echo ""
    echo "${fg[yellow]}📂 Creating TypeScript source structure...${reset_color}"

    # Types
    create_file "$PROJECT_ROOT/src/types/common.ts"
    create_file "$PROJECT_ROOT/src/types/media.ts"
    create_file "$PROJECT_ROOT/src/types/api.ts"
    create_file "$PROJECT_ROOT/src/types/events.ts"

    # Core
    create_file "$PROJECT_ROOT/src/core/events/EventBus.ts"
    create_file "$PROJECT_ROOT/src/core/events/EventListener.ts"
    create_file "$PROJECT_ROOT/src/core/state/AppState.ts"
    create_file "$PROJECT_ROOT/src/core/state/MediaState.ts"
    create_file "$PROJECT_ROOT/src/core/state/PlaybackState.ts"
    create_file "$PROJECT_ROOT/src/core/di/Container.ts"
    create_file "$PROJECT_ROOT/src/core/di/ServiceRegistry.ts"

    # API
    create_file "$PROJECT_ROOT/src/api/base/ApiClient.ts"
    create_file "$PROJECT_ROOT/src/api/base/RequestBuilder.ts"
    create_file "$PROJECT_ROOT/src/api/base/ResponseParser.ts"
    create_file "$PROJECT_ROOT/src/api/base/ErrorHandler.ts"
    create_file "$PROJECT_ROOT/src/api/services/VideoApiService.ts"
    create_file "$PROJECT_ROOT/src/api/services/AudioApiService.ts"
    create_file "$PROJECT_ROOT/src/api/services/MusicApiService.ts"
    create_file "$PROJECT_ROOT/src/api/services/PowerApiService.ts"
    create_file "$PROJECT_ROOT/src/api/endpoints/OpenEndpoint.ts"
    create_file "$PROJECT_ROOT/src/api/endpoints/ListEndpoint.ts"
    create_file "$PROJECT_ROOT/src/api/endpoints/ThumbnailEndpoint.ts"
    create_file "$PROJECT_ROOT/src/api/endpoints/TrashEndpoint.ts"

    # Models
    create_file "$PROJECT_ROOT/src/models/entities/Track.ts"
    create_file "$PROJECT_ROOT/src/models/entities/Album.ts"
    create_file "$PROJECT_ROOT/src/models/entities/VideoItem.ts"
    create_file "$PROJECT_ROOT/src/models/entities/FolderItem.ts"
    create_file "$PROJECT_ROOT/src/models/entities/Playlist.ts"
    create_file "$PROJECT_ROOT/src/models/value-objects/FilePath.ts"
    create_file "$PROJECT_ROOT/src/models/value-objects/Duration.ts"
    create_file "$PROJECT_ROOT/src/models/value-objects/Volume.ts"
    create_file "$PROJECT_ROOT/src/models/value-objects/TrackNumber.ts"
    create_file "$PROJECT_ROOT/src/models/value-objects/ArtistName.ts"
    create_file "$PROJECT_ROOT/src/models/factories/AlbumFactory.ts"
    create_file "$PROJECT_ROOT/src/models/factories/TrackFactory.ts"

    # Services
    create_file "$PROJECT_ROOT/src/services/playback/PlaybackController.ts"
    create_file "$PROJECT_ROOT/src/services/playback/PlaybackStateManager.ts"
    create_file "$PROJECT_ROOT/src/services/playback/PlaylistManager.ts"
    create_file "$PROJECT_ROOT/src/services/playback/TrackNavigator.ts"
    create_file "$PROJECT_ROOT/src/services/playback/VolumeController.ts"
    create_file "$PROJECT_ROOT/src/services/video/DirectoryNavigator.ts"
    create_file "$PROJECT_ROOT/src/services/video/VideoScanner.ts"
    create_file "$PROJECT_ROOT/src/services/video/VideoDeleter.ts"
    create_file "$PROJECT_ROOT/src/services/video/VideoItemFilter.ts"
    create_file "$PROJECT_ROOT/src/services/audio/AlbumService.ts"
    create_file "$PROJECT_ROOT/src/services/audio/TrackService.ts"
    create_file "$PROJECT_ROOT/src/services/audio/MetadataService.ts"
    create_file "$PROJECT_ROOT/src/services/thumbnail/ThumbnailCache.ts"
    create_file "$PROJECT_ROOT/src/services/thumbnail/ThumbnailFetcher.ts"
    create_file "$PROJECT_ROOT/src/services/thumbnail/ThumbnailLoader.ts"
    create_file "$PROJECT_ROOT/src/services/power/TVPowerService.ts"
    create_file "$PROJECT_ROOT/src/services/power/ComputerPowerService.ts"

    # UI Components
    create_file "$PROJECT_ROOT/src/ui/components/Button.ts"
    create_file "$PROJECT_ROOT/src/ui/components/Icon.ts"
    create_file "$PROJECT_ROOT/src/ui/components/Modal.ts"
    create_file "$PROJECT_ROOT/src/ui/components/Notification.ts"
    create_file "$PROJECT_ROOT/src/ui/components/Spinner.ts"
    create_file "$PROJECT_ROOT/src/ui/components/LoadingIndicator.ts"
    create_file "$PROJECT_ROOT/src/ui/components/EmptyStateRenderer.ts"
    create_file "$PROJECT_ROOT/src/ui/components/DeleteSwipeHandler.ts"
    create_file "$PROJECT_ROOT/src/ui/components/CustomDeleteDialog.ts"

    # UI Pages
    create_file "$PROJECT_ROOT/src/ui/pages/BasePage.ts"
    create_file "$PROJECT_ROOT/src/ui/pages/VideoPage.ts"
    create_file "$PROJECT_ROOT/src/ui/pages/AudioPage.ts"
    create_file "$PROJECT_ROOT/src/ui/pages/PowerPage.ts"

    # UI Widgets - Album
    create_file "$PROJECT_ROOT/src/ui/widgets/album/AlbumCard.ts"
    create_file "$PROJECT_ROOT/src/ui/widgets/album/AlbumGrid.ts"
    create_file "$PROJECT_ROOT/src/ui/widgets/album/AlbumModal.ts"
    create_file "$PROJECT_ROOT/src/ui/widgets/album/TrackList.ts"

    # UI Widgets - Player
    create_file "$PROJECT_ROOT/src/ui/widgets/player/UniversalPlayer.ts"
    create_file "$PROJECT_ROOT/src/ui/widgets/player/VideoPlayer.ts"
    create_file "$PROJECT_ROOT/src/ui/widgets/player/AudioPlayer.ts"
    create_file "$PROJECT_ROOT/src/ui/widgets/player/PlayerControls.ts"
    create_file "$PROJECT_ROOT/src/ui/widgets/player/PlayerProgress.ts"
    create_file "$PROJECT_ROOT/src/ui/widgets/player/VolumeControl.ts"
    create_file "$PROJECT_ROOT/src/ui/widgets/player/AudioOutputSelector.ts"

    # UI Widgets - Navigation
    create_file "$PROJECT_ROOT/src/ui/widgets/navigation/Sidebar.ts"
    create_file "$PROJECT_ROOT/src/ui/widgets/navigation/Breadcrumb.ts"
    create_file "$PROJECT_ROOT/src/ui/widgets/navigation/MobileNav.ts"
    create_file "$PROJECT_ROOT/src/ui/widgets/navigation/SearchBar.ts"

    # UI Renderers
    create_file "$PROJECT_ROOT/src/ui/renderers/VideoItemRenderer.ts"
    create_file "$PROJECT_ROOT/src/ui/renderers/FolderItemRenderer.ts"
    create_file "$PROJECT_ROOT/src/ui/renderers/TrackItemRenderer.ts"
    create_file "$PROJECT_ROOT/src/ui/renderers/AlbumCoverRenderer.ts"

    # Handlers
    create_file "$PROJECT_ROOT/src/handlers/video/VideoLoadHandler.ts"
    create_file "$PROJECT_ROOT/src/handlers/video/VideoPlayHandler.ts"
    create_file "$PROJECT_ROOT/src/handlers/video/VideoDeleteHandler.ts"
    create_file "$PROJECT_ROOT/src/handlers/video/VideoRefreshHandler.ts"
    create_file "$PROJECT_ROOT/src/handlers/audio/AlbumPlayHandler.ts"
    create_file "$PROJECT_ROOT/src/handlers/audio/AlbumClickHandler.ts"
    create_file "$PROJECT_ROOT/src/handlers/audio/TrackEditHandler.ts"
    create_file "$PROJECT_ROOT/src/handlers/audio/PlaylistHandler.ts"
    create_file "$PROJECT_ROOT/src/handlers/power/TVPowerHandler.ts"
    create_file "$PROJECT_ROOT/src/handlers/power/SleepHandler.ts"

    # Utils - Formatters
    create_file "$PROJECT_ROOT/src/utils/formatters/TimeFormatter.ts"
    create_file "$PROJECT_ROOT/src/utils/formatters/SizeFormatter.ts"
    create_file "$PROJECT_ROOT/src/utils/formatters/TrackNameFormatter.ts"
    create_file "$PROJECT_ROOT/src/utils/formatters/ArtistNameFormatter.ts"

    # Utils - Validators
    create_file "$PROJECT_ROOT/src/utils/validators/PathValidator.ts"
    create_file "$PROJECT_ROOT/src/utils/validators/FileNameValidator.ts"
    create_file "$PROJECT_ROOT/src/utils/validators/VolumeValidator.ts"

    # Utils - Cache
    create_file "$PROJECT_ROOT/src/utils/cache/MemoryCache.ts"
    create_file "$PROJECT_ROOT/src/utils/cache/ThumbnailCache.ts"
    create_file "$PROJECT_ROOT/src/utils/cache/MetadataCache.ts"

    # Utils - DOM
    create_file "$PROJECT_ROOT/src/utils/dom/DomSelector.ts"
    create_file "$PROJECT_ROOT/src/utils/dom/DomModifier.ts"
    create_file "$PROJECT_ROOT/src/utils/dom/TouchHandler.ts"
    create_file "$PROJECT_ROOT/src/utils/dom/SwipeDetector.ts"

    # Config
    create_file "$PROJECT_ROOT/src/config/AppConfig.ts"
    create_file "$PROJECT_ROOT/src/config/Routes.ts"
    create_file "$PROJECT_ROOT/src/config/Endpoints.ts"
    create_file "$PROJECT_ROOT/src/config/Constants.ts"

    # Entry point
    create_file "$PROJECT_ROOT/src/index.ts"
}

# Create public directory structure
create_public_structure() {
    echo ""
    echo "${fg[yellow]}🌐 Creating public directory structure...${reset_color}"

    create_file "$PROJECT_ROOT/public/css/styles.css"
    create_file "$PROJECT_ROOT/public/css/universal-player.css"
    create_file "$PROJECT_ROOT/public/pages/video.html"
    create_file "$PROJECT_ROOT/public/pages/audio.html"
    create_file "$PROJECT_ROOT/public/pages/power.html"
}

# Print summary
print_summary() {
    echo ""
    echo "${fg[green]}✅ Project structure created successfully!${reset_color}"
    echo ""
    echo "${fg[cyan]}📊 Statistics:${reset_color}"

    local file_count=$(find "$PROJECT_ROOT/src" -type f -name "*.ts" 2>/dev/null | wc -l | xargs)
    local config_count=$(find "$PROJECT_ROOT" -maxdepth 1 -type f \( -name "*.json" -o -name "*.ts" -o -name "*.html" \) 2>/dev/null | wc -l | xargs)
    local public_count=$(find "$PROJECT_ROOT/public" -type f 2>/dev/null | wc -l | xargs)

    echo "  📁 TypeScript files: $file_count"
    echo "  ⚙️  Config files: $config_count"
    echo "  🎨 Public files: $public_count"
    echo ""
    echo "${fg[yellow]}Next steps:${reset_color}"
    echo "  cd $PROJECT_NAME"
    echo "  npm install"
    echo "  npm run dev"
    echo ""
}

# Main execution
main() {
    create_root_configs
    create_ts_structure
    create_public_structure
    print_summary
}

main
