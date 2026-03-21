const PlayerManager = {
    currentFile: null,
    isPlaying: false,
    isFullscreen: false,
    statusCheckInterval: null,
    apiAvailable: false,
    maxRetries: 30,
    retryDelay: 2000,
    playerActive: false,
    isMobile: false,
    serverHost: window.location.hostname,
    fullscreenRetryInterval: null,
    currentMediaType: 'video',
    init() {
        this.setupEventListeners();
        this.setPlayerActive(false);
        this.checkMobile();
        console.log('Server host:', this.serverHost);
        console.log('Server URL:', this.getServerUrl());
        console.log('Player URL:', this.getPlayerUrl());
    },
    getServerUrl() {
        return `http://${this.serverHost}:${CONFIG.SERVER_PORT}`;
    },
    getPlayerUrl() {
        return `http://${this.serverHost}:${CONFIG.PLAYER_PORT}`;
    },
    checkMobile() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('Mobile device:', this.isMobile);
    },
    setupEventListeners() {
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('seekForwardBtn').addEventListener('click', () => this.seekForward());
        document.getElementById('seekBackwardBtn').addEventListener('click', () => this.seekBackward());
        document.getElementById('closeFileBtn').addEventListener('click', () => this.closeFile());
        document.querySelector('.close-control-page').addEventListener('click', () => this.hideControl());
        document.getElementById('topPlayPauseBtn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('topSeekForwardBtn').addEventListener('click', () => this.seekForward());
        document.getElementById('topSeekBackwardBtn').addEventListener('click', () => this.seekBackward());
        document.getElementById('topCloseFileBtn').addEventListener('click', () => this.closeFile());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('deleteFileBtn').addEventListener('click', () => this.deleteFile());
        document.getElementById('topDeleteFileBtn').addEventListener('click', () => this.deleteFile());
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        const topFullscreenBtn = document.getElementById('topFullscreenBtn');
        if (topFullscreenBtn) topFullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    },
    async seekForward() {
        if (!this.currentFile) return;
        try {
            console.log('Seeking forward 10 seconds');
            const url = `${this.getPlayerUrl()}/api/seekforward`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seconds: 10 })
            });
            const data = await response.json();
            if (data.success) {
                Utils.showNotification('Вперед 10 секунд', 'success');
            } else {
                Utils.showNotification('Ошибка перемотки', 'error');
            }
        } catch (error) {
            console.error('Seek forward error:', error);
            Utils.showNotification('Ошибка перемотки: ' + error.message, 'error');
        }
    },
    async seekBackward() {
        if (!this.currentFile) return;
        try {
            console.log('Seeking backward 10 seconds');
            const url = `${this.getPlayerUrl()}/api/seekbackward`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seconds: 10 })
            });
            const data = await response.json();
            if (data.success) {
                Utils.showNotification('Назад 10 секунд', 'success');
            } else {
                Utils.showNotification('Ошибка перемотки', 'error');
            }
        } catch (error) {
            console.error('Seek backward error:', error);
            Utils.showNotification('Ошибка перемотки: ' + error.message, 'error');
        }
    },
    setPlayerActive(active) {
        this.playerActive = active;
        const topPlayerBar = document.getElementById('topPlayerBar');
        const topPlayBtn = document.getElementById('topPlayPauseBtn');
        const topSeekForwardBtn = document.getElementById('topSeekForwardBtn');
        const topSeekBackwardBtn = document.getElementById('topSeekBackwardBtn');
        const topCloseBtn = document.getElementById('topCloseFileBtn');
        const topDeleteBtn = document.getElementById('topDeleteFileBtn');
        const topFullscreenBtn = document.getElementById('topFullscreenBtn');
        if (active) {
            if (topPlayerBar) topPlayerBar.classList.add('active');
            topPlayBtn.classList.add('active');
            topSeekForwardBtn.classList.add('active');
            topSeekBackwardBtn.classList.add('active');
            topCloseBtn.classList.add('active');
            topDeleteBtn.classList.add('active');
            if (topFullscreenBtn) topFullscreenBtn.classList.add('active');
            if (this.isPlaying) topPlayBtn.classList.add('playing');
            topSeekForwardBtn.disabled = false;
            topSeekBackwardBtn.disabled = false;
            topPlayBtn.disabled = false;
            topCloseBtn.disabled = false;
            topDeleteBtn.disabled = false;
            if (topFullscreenBtn) topFullscreenBtn.disabled = false;
        } else {
            if (topPlayerBar) topPlayerBar.classList.remove('active');
            topPlayBtn.classList.remove('active', 'playing');
            topSeekForwardBtn.classList.remove('active');
            topSeekBackwardBtn.classList.remove('active');
            topCloseBtn.classList.remove('active');
            topDeleteBtn.classList.remove('active');
            if (topFullscreenBtn) topFullscreenBtn.classList.remove('active');
            topPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
            topSeekForwardBtn.disabled = true;
            topSeekBackwardBtn.disabled = true;
            topPlayBtn.disabled = true;
            topCloseBtn.disabled = true;
            topDeleteBtn.disabled = true;
            if (topFullscreenBtn) topFullscreenBtn.disabled = true;
        }
    },
    updateTopBar() {
        if (!this.playerActive || !this.currentFile) return;
        const topPlayBtn = document.getElementById('topPlayPauseBtn');
        topPlayBtn.innerHTML = this.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        if (this.isPlaying) topPlayBtn.classList.add('playing');
        else topPlayBtn.classList.remove('playing');
    },
    async launchPlayerWithFile(path) {
        console.log('Launching player with file:', path);
        try {
            const url = `${this.getServerUrl()}/api/open`;
            console.log('Launch URL:', url);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: path })
            });
            const data = await response.json();
            console.log('Launch response:', data);
            if (data.success) return true;
            else throw new Error(data.error || 'Failed to launch player');
        } catch (error) {
            console.error('Error launching player:', error);
            throw error;
        }
    },
    async checkApiAvailability() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const url = `${this.getPlayerUrl()}/api/status`;
            console.log('Checking API at:', url);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                const data = await response.json();
                console.log('API check result:', data);
                return data && data.available === true;
            }
        } catch (error) {
            if (error.name === 'AbortError') console.log('API check timeout');
            else console.log('API not available yet:', error.message);
        }
        return false;
    },
    async checkFullscreenStatus() {
        if (!this.currentFile) return false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const url = `${this.getPlayerUrl()}/api/status`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) return false;
            const data = await response.json();
            if (data && data.available) {
                const isFullScreen = data.isFullScreen === true || data.isFullScreen === "true" || data.isFullScreen === 1;
                this.isFullscreen = isFullScreen;
                this.updateFullscreenButton();
                return this.isFullscreen;
            }
        } catch (error) {}
        return false;
    },
    updateFullscreenButton() {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const topFullscreenBtn = document.getElementById('topFullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.innerHTML = this.isFullscreen ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
            if (this.isFullscreen) fullscreenBtn.classList.add('active');
            else fullscreenBtn.classList.remove('active');
        }
        if (topFullscreenBtn) {
            topFullscreenBtn.innerHTML = this.isFullscreen ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
        }
    },
    async toggleFullscreen() {
        if (!this.currentFile) return;
        try {
            const newState = !this.isFullscreen;
            const url = `${this.getPlayerUrl()}/api/fullscreen`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullscreen: newState })
            });
            const data = await response.json();
            if (data.success) {
                this.isFullscreen = newState;
                this.updateFullscreenButton();
                Utils.showNotification(newState ? 'Полноэкранный режим включен' : 'Полноэкранный режим выключен', 'success');
            }
        } catch (error) {
            Utils.showNotification('Ошибка при переключении полноэкранного режима: ' + error.message, 'error');
        }
    },
    updateProgressBar(attempt, maxAttempts) {
        const progressBar = document.getElementById('loadingProgress');
        const progressFill = progressBar.querySelector('.loading-progress-bar');
        progressBar.classList.add('active');
        progressFill.style.width = (attempt / maxAttempts * 100) + '%';
        const placeholder = document.querySelector('.player-placeholder');
        if (placeholder && this.currentFile) {
            const mediaType = Utils.getMediaTypeFromPath(this.currentFile);
            const mediaName = mediaType === 'audio' ? 'аудиоплеера' : 'Mediateka';
            placeholder.innerHTML = `
                <i class="fas fa-spinner fa-spin" style="font-size: 60px;"></i>
                <div>Запуск ${mediaName} на сервере ${this.serverHost}...</div>
                <div style="font-size: 0.9rem; margin-top: 20px; color: var(--fg3);">Пожалуйста, подождите...</div>
            `;
        }
    },
    hideProgressBar() {
        const progressBar = document.getElementById('loadingProgress');
        progressBar.classList.remove('active');
        progressBar.querySelector('.loading-progress-bar').style.width = '0%';
    },
    async playMedia(path) {
        try {
            this.currentFile = path;
            this.currentMediaType = Utils.getMediaTypeFromPath(path);
            const mediaType = this.currentMediaType;
            this.showControl(path, mediaType);
            console.log('Launching player for file:', path);
            console.log('Media type:', mediaType);
            console.log('Server host:', this.serverHost);
            let isPlayerRunning = false;
            try {
                const url = `${this.getPlayerUrl()}/api/status`;
                console.log('Checking player status at:', url);
                const statusCheck = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                    signal: AbortSignal.timeout(2000)
                });
                if (statusCheck.ok) {
                    const statusData = await statusCheck.json();
                    isPlayerRunning = statusData.available === true;
                    console.log('Player already running:', isPlayerRunning);
                }
            } catch (e) {
                console.log('Player not running or API not responding');
                isPlayerRunning = false;
            }
            if (!isPlayerRunning) {
                console.log('Launching new player instance...');
                await this.launchPlayerWithFile(path);
                console.log('Player launched, waiting for API...');
                await Utils.delay(2000);
            } else {
                console.log('Player already running, sending open file command...');
                try {
                    const url = `${this.getPlayerUrl()}/api/openfile`;
                    console.log('Open file URL:', url);
                    const openResponse = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: path }),
                        signal: AbortSignal.timeout(5000)
                    });
                    if (!openResponse.ok) throw new Error(`HTTP error: ${openResponse.status}`);
                    const openData = await openResponse.json();
                    console.log('Open file response:', openData);
                    if (!openData.success) throw new Error(openData.error || 'Failed to open file');
                } catch (err) {
                    console.error('Error opening file:', err);
                    console.log('Falling back to launching new instance...');
                    await this.launchPlayerWithFile(path);
                    await Utils.delay(2000);
                }
            }
            console.log('Waiting for API...');
            let apiReady = false;
            for (let attempt = 1; attempt <= 30; attempt++) {
                this.updateProgressBar(attempt, 30);
                try {
                    const statusUrl = `${this.getPlayerUrl()}/api/status`;
                    const statusResponse = await fetch(statusUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}),
                        signal: AbortSignal.timeout(3000)
                    });
                    if (statusResponse.ok) {
                        const statusData = await statusResponse.json();
                        if (statusData && statusData.available === true) {
                            console.log(`API available on attempt ${attempt}`);
                            apiReady = true;
                            this.setPlayerActive(true);
                            const isPlayingStatus = statusData.isPlaying === true;
                            this.updatePlaybackStatus(isPlayingStatus);
                            this.updatePlayPauseButton();
                            this.updateTopBar();
                            this.statusCheckDelay = Date.now();
                            this.startStatusCheck();
                            if (mediaType === 'video') {
                                this.enableFullscreenAsync();
                            }
                            this.hideProgressBar();
                            break;
                        }
                    }
                } catch (error) {
                    console.log(`Attempt ${attempt}: API not ready (${error.message})`);
                }
                await Utils.delay(this.retryDelay);
            }
            if (!apiReady) {
                throw new Error('API плеера не отвечает после 30 попыток');
            }
            Utils.addToHistory(path, 'success');
            console.log('Media playback started successfully');
        } catch (error) {
            console.error('Error in playMedia:', error);
            this.setPlayerActive(false);
            this.showErrorState(error.message);
            Utils.addToHistory(this.currentFile || path, 'error');
            this.hideProgressBar();
        }
    },
    enableFullscreenAsync() {
        setTimeout(async () => {
            try {
                console.log('Attempting to enable fullscreen mode...');
                const fsUrl = `${this.getPlayerUrl()}/api/fullscreen`;
                const fsResponse = await fetch(fsUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullscreen: true })
                });
                if (fsResponse.ok) {
                    const fsData = await fsResponse.json();
                    if (fsData.success) {
                        console.log('Fullscreen enabled successfully');
                        this.isFullscreen = true;
                        this.updateFullscreenButton();
                    }
                }
            } catch (e) {
                console.log('Fullscreen attempt failed:', e.message);
            }
        }, 500);
        this.fullscreenRetryInterval = setInterval(() => {
            if (this.currentFile && !this.isFullscreen) {
                console.log('Periodic fullscreen check - attempting to enable');
                fetch(`${this.getPlayerUrl()}/api/fullscreen`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullscreen: true })
                }).then(() => {
                    this.isFullscreen = true;
                    this.updateFullscreenButton();
                }).catch(e => {});
            }
        }, 5000);
    },
    hideControl() {
        document.getElementById('playerControlPage').style.display = 'none';
        document.querySelector('.main-container').classList.remove('blurred');
        this.currentFile = null;
        this.stopStatusCheck();
        this.setPlayerActive(false);
        this.isFullscreen = false;
        this.updateFullscreenButton();
        if (this.fullscreenRetryInterval) {
            clearInterval(this.fullscreenRetryInterval);
            this.fullscreenRetryInterval = null;
        }
        document.querySelector('.player-control-header').style.borderColor = '';
    },
    showControl(filePath, mediaType = 'video') {
        document.getElementById('playerControlPage').style.display = 'flex';
        document.querySelector('.main-container').classList.add('blurred');
        const mediaName = mediaType === 'audio' ? 'аудиоплеера' : 'Mediateka';
        const icon = mediaType === 'audio' ? 'fa-music' : 'fa-film';
        const placeholder = document.querySelector('.player-placeholder');
        placeholder.innerHTML = `
            <i class="fas ${icon} fa-spin" style="font-size: 60px;"></i>
            <div>Открытие файла в ${mediaName} на сервере ${this.serverHost}...</div>
            <div style="font-size: 0.9rem; margin-top: 10px; color: var(--fg3);">Плеер запустится на сервере, управление будет доступно с этого устройства</div>
        `;
    },
    showSuccessState(mediaType = 'video') {
        this.updatePlaybackStatus(true);
        this.hideProgressBar();
    },
    showErrorState(message) {
        const placeholder = document.querySelector('.player-placeholder');
        placeholder.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: var(--red); font-size: 80px;"></i>
            <div style="color: var(--red);">Ошибка на сервере</div>
            <div style="font-size: 1rem; margin-top: 10px;">${message}</div>
            <button class="retry-btn" onclick="PlayerManager.retryOpen()">
                <i class="fas fa-redo-alt"></i> Повторить
            </button>
        `;
        document.querySelector('.player-control-header').style.borderColor = 'var(--red)';
        this.hideProgressBar();
    },
    retryOpen() {
        if (this.currentFile) this.playMedia(this.currentFile);
    },
    updatePlayPauseButton() {
        const btn = document.getElementById('playPauseBtn');
        btn.innerHTML = this.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        if (this.isPlaying) btn.classList.add('active');
        else btn.classList.remove('active');
    },
    async closeFile() {
        try {
            const url = `${this.getPlayerUrl()}/api/close`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    Utils.showNotification('Файл закрыт на сервере', 'success');
                }
            }
        } catch (error) {
            console.log('Player already closed or not responding:', error.message);
        } finally {
            this.hideControl();
        }
    },
    async togglePlayPause() {
        if (this.updatingStatus) return;
        try {
            this.updatingStatus = true;
            const endpoint = this.isPlaying ? 'pause' : 'play';
            const url = `${this.getPlayerUrl()}/api/${endpoint}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await response.json();
            if (data.success) {
                const newState = !this.isPlaying;
                this.isPlaying = newState;
                this.updatePlaybackStatus(newState);
                this.updatePlayPauseButton();
                this.updateTopBar();
                setTimeout(() => {
                    this.updatingStatus = false;
                }, 3000);
            } else {
                this.updatingStatus = false;
            }
        } catch (error) {
            this.updatingStatus = false;
            Utils.showNotification('Ошибка при переключении: ' + error.message, 'error');
        }
    },
    async checkStatus() {
        if (this.updatingStatus) return;
        if (!this.currentFile) return;
        if (this.statusCheckDelay && (Date.now() - this.statusCheckDelay) < 3000) return;
        try {
            const url = `${this.getPlayerUrl()}/api/status`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await response.json();
            if (data && data.available) {
                const isFullScreen = data.isFullScreen === true || data.isFullScreen === "true" || data.isFullScreen === 1;
                if (this.isFullscreen !== isFullScreen) {
                    this.isFullscreen = isFullScreen;
                    this.updateFullscreenButton();
                }
                if (data.isPlaying !== undefined && this.isPlaying !== data.isPlaying) {
                    console.log('Status mismatch, correcting:', {old: this.isPlaying, new: data.isPlaying});
                    this.isPlaying = data.isPlaying;
                    this.updatePlaybackStatus(this.isPlaying);
                    this.updatePlayPauseButton();
                    this.updateTopBar();
                }
            }
        } catch (error) {}
    },
    startStatusCheck() {
        this.stopStatusCheck();
        if (!this.isMobile) {
            this.statusCheckInterval = setInterval(() => this.checkStatus(), 5000);
        }
        this.createStatusIndicator();
    },
    stopStatusCheck() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
        }
        const indicator = document.querySelector('.status-indicator');
        if (indicator) {
            indicator.remove();
        }
    },
    createStatusIndicator() {
        let indicator = document.querySelector('.status-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'status-indicator';
            indicator.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: var(--green);
                box-shadow: 0 0 10px currentColor;
            `;
            indicator.title = `Подключение к серверу ${this.serverHost}`;
            document.querySelector('.player-control-header').appendChild(indicator);
        }
    },
    handleKeyPress(e) {
        if (!this.currentFile) return;
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.seekBackward();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.seekForward();
                break;
            case 'Delete':
            case 'Del':
                e.preventDefault();
                this.deleteFile();
                break;
            case 'KeyF':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'Escape':
                if (this.isFullscreen) this.toggleFullscreen();
                break;
        }
    },
    async deleteFile() {
        if (!this.currentFile) {
            this.hideControl();
            if (App && App.currentPath) App.loadDirectory(App.currentPath, this.currentMediaType);
            return;
        }
        let isPlayerRunning = false;
        try {
            const statusUrl = `${this.getPlayerUrl()}/api/status`;
            const statusResponse = await fetch(statusUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
                signal: AbortSignal.timeout(1000)
            });
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                isPlayerRunning = statusData.available === true;
            }
        } catch (e) {
            console.log('Player not running');
            isPlayerRunning = false;
        }
        if (!isPlayerRunning) {
            this.hideControl();
            if (App && App.currentPath) App.loadDirectory(App.currentPath, this.currentMediaType);
            return;
        }
        if (!confirm('Вы уверены, что хотите переместить файл в корзину?')) return;
        try {
            const url = `${this.getPlayerUrl()}/api/closefile`;
            console.log('Deleting file via:', url);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Delete response:', data);
                if (data.success) {
                    Utils.showNotification('Файл перемещён в корзину', 'success');
                } else {
                    Utils.showNotification('Файл закрыт, но не удалён', 'info');
                }
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            Utils.showNotification('Ошибка при удалении', 'error');
        } finally {
            this.hideControl();
            if (App && App.currentPath) App.loadDirectory(App.currentPath, this.currentMediaType);
        }
    },
    async checkCurrentPlayback() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const url = `${this.getPlayerUrl()}/api/status`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) return;
            const data = await response.json();
            if (data && data.available && data.currentFile && data.currentFile.available) {
                console.log('Player is already playing:', data.currentFile);
                this.currentFile = data.currentFile.path;
                this.currentMediaType = Utils.getMediaTypeFromPath(this.currentFile);
                this.isPlaying = data.isPlaying === true;
                this.isFullscreen = data.isFullScreen === true || data.isFullScreen === "true";
                this.setPlayerActive(true);
                this.showControl(this.currentFile, this.currentMediaType);
                this.updatePlaybackStatus(this.isPlaying);
                this.updatePlayPauseButton();
                this.updateTopBar();
                this.updateFullscreenButton();
                this.startStatusCheck();
                if (this.currentMediaType === 'video' && !this.isFullscreen) {
                    this.enableFullscreenAsync();
                }
                setTimeout(async () => {
                    try {
                        const checkUrl = `${this.getPlayerUrl()}/api/status`;
                        const checkResponse = await fetch(checkUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                        });
                        const checkData = await checkResponse.json();
                        if (checkData && checkData.available && checkData.isPlaying !== undefined && checkData.isPlaying !== this.isPlaying) {
                            console.log('Updating playback status after delay:', {old: this.isPlaying, new: checkData.isPlaying});
                            this.isPlaying = checkData.isPlaying;
                            this.updatePlaybackStatus(this.isPlaying);
                            this.updatePlayPauseButton();
                            this.updateTopBar();
                        }
                    } catch (e) {
                        console.log('Delayed status check failed:', e);
                    }
                }, 2000);
                return true;
            }
        } catch (error) {
            console.log('No active playback detected:', error.message);
        }
        return false;
    },
    updatePlaybackStatus(isPlaying) {
        this.isPlaying = isPlaying;
        const placeholder = document.querySelector('.player-placeholder');
        if (!placeholder) return;
        const fileName = this.currentFile ? this.currentFile.split('/').pop() : 'Файл';
        const mediaType = this.currentMediaType;
        const mediaName = mediaType === 'audio' ? 'Аудио' : 'Видео';
        const statusText = isPlaying ? 'Воспроизводится' : 'На паузе';
        const statusIcon = isPlaying ? '<i class="fas fa-play-circle" style="color: var(--green); font-size: 60px;"></i>' : '<i class="fas fa-pause-circle" style="color: var(--orange); font-size: 60px;"></i>';
        placeholder.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="margin-bottom: 20px;">
                    ${statusIcon}
                </div>
                <div style="font-size: 1.3rem; font-weight: 500; color: var(--fg0); margin-bottom: 10px; text-align: center; max-width: 80vw; word-break: break-word;">${fileName}</div>
                <div style="font-size: 1rem; color: ${isPlaying ? 'var(--green)' : 'var(--orange)'}; margin-bottom: 5px;">
                    ${statusText}
                </div>
                <div style="font-size: 0.9rem; color: var(--fg3);">${mediaName}</div>
            </div>
        `;
        document.querySelector('.player-control-header').style.borderColor = isPlaying ? 'var(--green)' : 'var(--orange)';
    },
};
