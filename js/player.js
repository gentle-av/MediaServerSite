const PlayerManager = {
    currentFile: null,
    isPlaying: false,
    isFullscreen: false,
    statusCheckInterval: null,
    apiAvailable: false,
    maxRetries: 30,
    retryDelay: 2000,
    playerActive: false,

    init() {
        this.setupEventListeners();
        this.setPlayerActive(false);
    },

    setupEventListeners() {
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('exitFullscreenBtn').addEventListener('click', () => this.exitFullscreen());
        document.getElementById('closeFileBtn').addEventListener('click', () => this.closeFile());
        document.querySelector('.close-control-page').addEventListener('click', () => this.hideControl());

        document.getElementById('topPlayPauseBtn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('topFullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('topCloseFileBtn').addEventListener('click', () => this.closeFile());

        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    },

    setPlayerActive(active) {
        this.playerActive = active;
        const topPlayBtn = document.getElementById('topPlayPauseBtn');
        const topFullscreenBtn = document.getElementById('topFullscreenBtn');
        const topCloseBtn = document.getElementById('topCloseFileBtn');

        if (active) {
            topPlayBtn.classList.add('active');
            topFullscreenBtn.classList.add('active');
            topCloseBtn.classList.add('active');
            if (this.isPlaying) {
                topPlayBtn.classList.add('playing');
            }
            this.updateFullscreenButton();
        } else {
            topPlayBtn.classList.remove('active', 'playing');
            topFullscreenBtn.classList.remove('active');
            topCloseBtn.classList.remove('active');
            topPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
            topFullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    },

    updateTopBar() {
        if (!this.playerActive || !this.currentFile) return;

        const topPlayBtn = document.getElementById('topPlayPauseBtn');
        topPlayBtn.innerHTML = this.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';

        if (this.isPlaying) {
            topPlayBtn.classList.add('playing');
        } else {
            topPlayBtn.classList.remove('playing');
        }
    },

    updateFullscreenButton() {
        const topFullscreenBtn = document.getElementById('topFullscreenBtn');
        const exitFullscreenBtn = document.getElementById('exitFullscreenBtn');

        if (this.isFullscreen) {
            topFullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            topFullscreenBtn.classList.add('active');
            exitFullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            topFullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            topFullscreenBtn.classList.remove('active');
            exitFullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    },

    async launchPlayerWithFile(path) {
        console.log('Launching player with file:', path);

        try {
            const response = await fetch(`http://localhost:${CONFIG.SERVER_PORT}/api/open`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: path })
            });

            const data = await response.json();
            console.log('Launch response:', data);

            if (data.success) {
                return true;
            } else {
                throw new Error(data.error || 'Failed to launch player');
            }
        } catch (error) {
            console.error('Error launching player:', error);
            throw error;
        }
    },

async checkApiAvailability() {
    try {
        const response = await fetch(`http://localhost:${CONFIG.PLAYER_PORT}/api/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        if (response.ok) {
            const data = await response.json();
            console.log('API check result:', data);
            // Проверяем что available это true и это булево значение
            return data && data.available === true;
        }
    } catch (error) {
        console.log('API not available yet (this is normal before player starts)');
    }
    return false;
},
async checkFullscreenStatus() {
    if (!this.currentFile) return false;
    try {
        const response = await fetch(`http://localhost:${CONFIG.PLAYER_PORT}/api/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        if (!response.ok) return false;

        const data = await response.json();
        console.log('Fullscreen status check raw data:', data);

        if (data && data.available) {
            // Явное преобразование в булево значение
            const isFullScreen = data.isFullScreen === true ||
                                 data.isFullScreen === "true" ||
                                 data.isFullScreen === 1;

            console.log('Parsed fullscreen status:', isFullScreen, 'from value:', data.isFullScreen);

            const wasFullscreen = this.isFullscreen;
            this.isFullscreen = isFullScreen;

            if (wasFullscreen !== this.isFullscreen) {
                console.log('Fullscreen status changed to:', this.isFullscreen);
                this.updateFullscreenButton();

                if (this.isFullscreen) {
                    document.querySelector('.status-indicator')?.style.setProperty('background', 'var(--green)');
                } else {
                    document.querySelector('.status-indicator')?.style.setProperty('background', 'var(--yellow)');
                }
            }

            return this.isFullscreen;
        }
    } catch (error) {
        console.log('Error checking fullscreen status:', error);
    }
    return false;
},
    async waitForApi(maxAttempts = this.maxRetries) {
        console.log('Waiting for player API to become available...');
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            this.updateProgressBar(attempt, maxAttempts);

            const isAvailable = await this.checkApiAvailability();

            if (isAvailable) {
                this.hideProgressBar();
                console.log('Player API is now available');

                // Проверяем статус полноэкранного режима
                await this.checkFullscreenStatus();

                return true;
            }

            console.log(`Attempt ${attempt}/${maxAttempts}: API not ready, waiting ${this.retryDelay}ms...`);
            await Utils.delay(this.retryDelay);
        }
        this.hideProgressBar();
        console.log('Player API did not become available after', maxAttempts, 'attempts');
        return false;
    },

    updateProgressBar(attempt, maxAttempts) {
        const progressBar = document.getElementById('loadingProgress');
        const progressFill = progressBar.querySelector('.loading-progress-bar');
        progressBar.classList.add('active');
        progressFill.style.width = (attempt / maxAttempts * 100) + '%';

        const placeholder = document.querySelector('.player-placeholder');
        if (placeholder && this.currentFile) {
            const secondsPassed = (attempt * this.retryDelay / 1000);
            const totalSeconds = (maxAttempts * this.retryDelay / 1000);

            placeholder.innerHTML = `
                <i class="fas fa-spinner fa-spin" style="font-size: 60px;"></i>
                <div>Запуск Mediateka...</div>
                <div style="font-size: 0.9rem; margin-top: 10px; color: var(--fg3);">
                    Попытка ${attempt} из ${maxAttempts}
                </div>
                <div style="font-size: 0.8rem; margin-top: 5px; color: var(--fg4);">
                    Прошло: ${secondsPassed}с / ~${totalSeconds}с
                </div>
                <div style="font-size: 0.8rem; margin-top: 20px; color: var(--fg4);">
                    Плеер запускается, пожалуйста подождите...
                </div>
            `;
        }
    },

    hideProgressBar() {
        const progressBar = document.getElementById('loadingProgress');
        progressBar.classList.remove('active');
        progressBar.querySelector('.loading-progress-bar').style.width = '0%';
    },

async playVideo(path) {
    try {
        this.currentFile = path;
        const fileName = path.split('/').pop();

        document.getElementById('playerTrackName').textContent = fileName;
        document.getElementById('playerTrackPath').textContent = path;

        this.showControl(path);
        document.getElementById('currentFileName').textContent = fileName;
        document.getElementById('currentFilePath').textContent = path;

        console.log('Launching player for file:', path);

        // ШАГ 1: Проверяем, запущен ли плеер и доступно ли API
        let isPlayerRunning = false;
        try {
            const statusCheck = await fetch(`http://localhost:${CONFIG.PLAYER_PORT}/api/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            if (statusCheck.ok) {
                const statusData = await statusCheck.json();
                isPlayerRunning = statusData.available === true;
                console.log('Player already running:', isPlayerRunning);
            }
        } catch (e) {
            console.log('Player not running or API not responding, will launch new instance');
            isPlayerRunning = false;
        }

        // ШАГ 2: Если плеер не запущен, запускаем его
        if (!isPlayerRunning) {
            console.log('Launching new player instance...');
            await this.launchPlayerWithFile(path);
            console.log('Player launched, waiting for API to become available...');

            // Даем больше времени на запуск плеера
            await Utils.delay(3000);
        } else {
            console.log('Player already running, sending open file command...');
            try {
                const openResponse = await fetch(`http://localhost:${CONFIG.PLAYER_PORT}/api/openfile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: path })
                });

                if (!openResponse.ok) {
                    throw new Error(`HTTP error: ${openResponse.status}`);
                }

                const openData = await openResponse.json();
                console.log('Open file response:', openData);

                if (!openData.success) {
                    throw new Error(openData.error || 'Failed to open file in running player');
                }

                // Даем время на загрузку файла
                await Utils.delay(2000);
            } catch (err) {
                console.error('Error opening file in running player:', err);
                console.log('Falling back to launching new player instance...');
                await this.launchPlayerWithFile(path);
                await Utils.delay(3000);
            }
        }

        // ШАГ 3: Ждем API с увеличенным количеством попыток
        console.log('Waiting for API to become available...');
        const apiReady = await this.waitForApi(40); // Увеличиваем до 40 попыток

        if (!apiReady) {
            throw new Error('API плеера не отвечает. Проверьте, запущена ли Mediateka');
        }

        console.log('API is ready');

        // ШАГ 4: Даем команду на полноэкранный режим
        console.log('Enabling fullscreen mode...');

        // Несколько попыток включить полноэкранный режим
        let fullscreenEnabled = false;
        for (let attempt = 1; attempt <= 5; attempt++) {
            try {
                console.log(`Fullscreen enable attempt ${attempt}/5...`);

                const fsResponse = await fetch(`http://localhost:${CONFIG.PLAYER_PORT}/api/fullscreen`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullscreen: true })
                });

                if (fsResponse.ok) {
                    const fsData = await fsResponse.json();
                    console.log('Fullscreen response:', fsData);

                    if (fsData.success) {
                        fullscreenEnabled = true;
                        break;
                    }
                }
            } catch (err) {
                console.warn(`Fullscreen attempt ${attempt} failed:`, err);
            }

            await Utils.delay(1000);
        }

        // ШАГ 5: Проверяем статус полноэкранного режима
        if (fullscreenEnabled) {
            console.log('Fullscreen command sent successfully');
            await Utils.delay(1500);
        }

        // ШАГ 6: Проверяем финальный статус
        try {
            await this.checkFullscreenStatus();
        } catch (err) {
            console.warn('Could not verify fullscreen status:', err);
        }

        // ШАГ 7: Активируем UI
        this.setPlayerActive(true);
        this.showSuccessState();
        this.isPlaying = true;
        this.updatePlayPauseButton();
        this.updateTopBar();
        this.startStatusCheck();

        Utils.addToHistory(path, 'success');
        console.log('Video playback started successfully, fullscreen status:', this.isFullscreen);

    } catch (error) {
        console.error('Error in playVideo:', error);
        this.setPlayerActive(false);
        this.showErrorState(error.message);
        Utils.addToHistory(this.currentFile || path, 'error');
    }
},

async checkApiAvailability() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 секунды таймаут

        const response = await fetch(`http://localhost:${CONFIG.PLAYER_PORT}/api/status`, {
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
        if (error.name === 'AbortError') {
            console.log('API check timeout');
        } else {
            console.log('API not available yet:', error.message);
        }
    }
    return false;
},

async waitForApi(maxAttempts = 40) {
    console.log('Waiting for player API to become available...');
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        this.updateProgressBar(attempt, maxAttempts);

        try {
            const isAvailable = await this.checkApiAvailability();

            if (isAvailable) {
                this.hideProgressBar();
                console.log('Player API is now available');
                return true;
            }
        } catch (error) {
            lastError = error;
        }

        console.log(`Attempt ${attempt}/${maxAttempts}: API not ready, waiting ${this.retryDelay}ms...`);
        await Utils.delay(this.retryDelay);
    }

    this.hideProgressBar();
    console.log('Player API did not become available after', maxAttempts, 'attempts');
    if (lastError) {
        console.log('Last error:', lastError);
    }
    return false;
},

async checkFullscreenStatus() {
    if (!this.currentFile) return false;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`http://localhost:${CONFIG.PLAYER_PORT}/api/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) return false;

        const data = await response.json();
        console.log('Fullscreen status check raw data:', data);

        if (data && data.available) {
            const isFullScreen = data.isFullScreen === true ||
                                 data.isFullScreen === "true" ||
                                 data.isFullScreen === 1;

            console.log('Parsed fullscreen status:', isFullScreen, 'from value:', data.isFullScreen);

            const wasFullscreen = this.isFullscreen;
            this.isFullscreen = isFullScreen;

            if (wasFullscreen !== this.isFullscreen) {
                console.log('Fullscreen status changed to:', this.isFullscreen);
                this.updateFullscreenButton();

                if (this.isFullscreen) {
                    document.querySelector('.status-indicator')?.style.setProperty('background', 'var(--green)');
                } else {
                    document.querySelector('.status-indicator')?.style.setProperty('background', 'var(--yellow)');
                }
            }

            return this.isFullscreen;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Fullscreen status check timeout');
        } else {
            console.log('Error checking fullscreen status:', error.message);
        }
    }
    return false;
},

async waitForApi(maxAttempts = 20) { // Увеличим количество попыток
    console.log('Waiting for player API to become available...');
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        this.updateProgressBar(attempt, maxAttempts);

        const isAvailable = await this.checkApiAvailability();

        if (isAvailable) {
            this.hideProgressBar();
            console.log('Player API is now available');
            return true;
        }

        console.log(`Attempt ${attempt}/${maxAttempts}: API not ready, waiting ${this.retryDelay}ms...`);
        await Utils.delay(this.retryDelay);
    }
    this.hideProgressBar();
    console.log('Player API did not become available after', maxAttempts, 'attempts');
    return false;
},
    showControl(filePath) {
        document.getElementById('playerControlPage').style.display = 'flex';
        document.querySelector('.main-container').classList.add('blurred');

        const placeholder = document.querySelector('.player-placeholder');
        placeholder.innerHTML = `
            <i class="fas fa-spinner fa-spin" style="font-size: 60px;"></i>
            <div>Открытие файла в Mediateka...</div>
        `;
    },

    showSuccessState() {
        const placeholder = document.querySelector('.player-placeholder');
        placeholder.innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--green); font-size: 80px;"></i>
            <div style="color: var(--green);">Файл успешно открыт</div>
            <div style="font-size: 1rem; margin-top: 10px; color: var(--fg3);">Видео воспроизводится в Mediateka</div>
        `;
        document.querySelector('.player-control-header').style.borderColor = 'var(--green)';
        this.hideProgressBar();
    },

    showErrorState(message) {
        const placeholder = document.querySelector('.player-placeholder');
        placeholder.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: var(--red); font-size: 80px;"></i>
            <div style="color: var(--red);">Ошибка</div>
            <div style="font-size: 1rem; margin-top: 10px;">${message}</div>
            <button class="retry-btn" onclick="PlayerManager.retryOpen()">
                <i class="fas fa-redo-alt"></i> Повторить
            </button>
        `;
        document.querySelector('.player-control-header').style.borderColor = 'var(--red)';
        this.hideProgressBar();
    },

    retryOpen() {
        if (this.currentFile) {
            this.playVideo(this.currentFile);
        }
    },

    hideControl() {
        document.getElementById('playerControlPage').style.display = 'none';
        document.querySelector('.main-container').classList.remove('blurred');
        this.currentFile = null;
        this.stopStatusCheck();
        this.setPlayerActive(false);
        this.isFullscreen = false;
        document.querySelector('.player-control-header').style.borderColor = '';
        document.getElementById('playerTrackName').textContent = 'Нет активного файла';
        document.getElementById('playerTrackPath').textContent = '';
    },

    async togglePlayPause() {
        try {
            const endpoint = this.isPlaying ?
                `http://localhost:${CONFIG.PLAYER_PORT}/api/pause` :
                `http://localhost:${CONFIG.PLAYER_PORT}/api/play`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await response.json();
            if (data.success) {
                this.isPlaying = !this.isPlaying;
                this.updatePlayPauseButton();
                this.updateTopBar();
            }
        } catch (error) {
            Utils.showNotification('Ошибка при переключении: ' + error.message, 'error');
        }
    },

    updatePlayPauseButton() {
        const btn = document.getElementById('playPauseBtn');
        btn.innerHTML = this.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        if (this.isPlaying) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    },

    async toggleFullscreen() {
        const newState = !this.isFullscreen;
        console.log('Toggling fullscreen to:', newState);

        try {
            const response = await fetch(`http://localhost:${CONFIG.PLAYER_PORT}/api/fullscreen`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullscreen: newState })
            });

            const data = await response.json();
            if (data.success) {
                this.isFullscreen = newState;
                this.updateFullscreenButton();
                Utils.showNotification(newState ? 'Полноэкранный режим' : 'Оконный режим', 'info');
            } else {
                Utils.showNotification('Не удалось изменить режим', 'error');
            }
        } catch (error) {
            console.error('Fullscreen toggle error:', error);
            Utils.showNotification('Ошибка при переключении режима', 'error');
        }
    },

exitFullscreen() {
    console.log('Exit fullscreen called');
    this.setFullscreen(false);
},

async setFullscreen(enable) {
    console.log('Setting fullscreen to:', enable);
    try {
        const response = await fetch(`http://localhost:${CONFIG.PLAYER_PORT}/api/fullscreen`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullscreen: enable })
        });
        const data = await response.json();
        console.log('Fullscreen response:', data);
        if (data.success) {
            this.isFullscreen = enable;
            this.updateFullscreenButton();
            Utils.showNotification(
                enable ? 'Полноэкранный режим включен' : 'Полноэкранный режим выключен',
                'info'
            );
        } else {
            Utils.showNotification('Не удалось изменить режим: ' + (data.error || 'unknown error'), 'error');
        }
        return data.success;
    } catch (error) {
        console.error('Fullscreen error:', error);
        Utils.showNotification('Ошибка при переключении режима: ' + error.message, 'error');
        return false;
    }
},
    async closeFile() {
        try {
            const response = await fetch(`http://localhost:${CONFIG.PLAYER_PORT}/api/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await response.json();
            if (data.success) {
                Utils.showNotification('Файл закрыт', 'success');
                this.hideControl();
            } else {
                Utils.showNotification('Ошибка: ' + data.error, 'error');
            }
        } catch (error) {
            Utils.showNotification('Ошибка при закрытии: ' + error.message, 'error');
        }
    },

async checkStatus() {
    if (!this.currentFile) return;
    try {
        const response = await fetch(`http://localhost:${CONFIG.PLAYER_PORT}/api/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const data = await response.json();
        // Исправление: проверяем, что данные получены
        if (data && data.available) {
            const wasFullscreen = this.isFullscreen;
            this.isFullscreen = data.isFullScreen === true || data.isFullScreen === "true";

            if (wasFullscreen !== this.isFullscreen) {
                this.updateFullscreenButton();
            }

            if (this.isFullscreen) {
                document.querySelector('.status-indicator')?.style.setProperty('background', 'var(--green)');
            } else {
                document.querySelector('.status-indicator')?.style.setProperty('background', 'var(--yellow)');
            }
        }
    } catch (error) {
        // Тихо игнорируем ошибки статуса
    }
},
    startStatusCheck() {
        this.stopStatusCheck();
        this.statusCheckInterval = setInterval(() => this.checkStatus(), 2000);
        this.createStatusIndicator();
    },

    stopStatusCheck() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
        }
        document.querySelector('.status-indicator')?.remove();
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
                background: var(--yellow);
                box-shadow: 0 0 10px currentColor;
            `;
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
            case 'Escape':
                if (this.isFullscreen) {
                    this.setFullscreen(false);
                }
                break;
        }
    }
};
