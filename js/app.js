const App = {
    currentPath: CONFIG.ROOT_PATH,
    currentMediaType: 'video',
    sliderWrapper: null,
    isDragging: false,
    startY: 0,
    scrollTop: 0,
    pathHistory: [],

    init() {
        this.sliderWrapper = document.getElementById('sliderWrapper');
        PlayerManager.init();
        this.setupEventListeners();
        this.loadDirectory(CONFIG.ROOT_PATH, 'video');
        this.updateBackButton();
    },

    setupEventListeners() {
        this.setupDragScroll();
        this.sliderWrapper.addEventListener('scroll', () => this.updateScrollIndicator());
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
    },

    goBack() {
          if (this.pathHistory.length > 0) {
              const previousPath = this.pathHistory.pop();
              this.loadDirectory(previousPath, this.currentMediaType);
          }
          this.updateBackButton();
     },

     updateBackButton() {
          const backBtn = document.getElementById('backBtn');
          const currentPathEl = document.getElementById('currentPath');
          if (backBtn) {
              backBtn.disabled = this.pathHistory.length === 0;
          }
          if (currentPathEl) {
              currentPathEl.textContent = this.currentPath;
          }
     },

    setupDragScroll() {
        this.sliderWrapper.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.startY = e.pageY - this.sliderWrapper.offsetTop;
            this.scrollTop = this.sliderWrapper.scrollTop;
        });
        this.sliderWrapper.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
        this.sliderWrapper.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        this.sliderWrapper.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            e.preventDefault();
            const y = e.pageY - this.sliderWrapper.offsetTop;
            const walk = (y - this.startY) * 2;
            this.sliderWrapper.scrollTop = this.scrollTop - walk;
            this.updateScrollIndicator();
        });
    },

    async loadDirectory(path, mediaType = 'video') {
        if (this.currentPath !== path) {
            this.pathHistory.push(this.currentPath);
        }
        this.currentPath = path;
        this.currentMediaType = mediaType;
        const sliderContent = document.getElementById('sliderContent');
        sliderContent.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i>Загрузка...</div>';
        try {
            const response = await fetch(CONFIG.API_ENDPOINTS.LIST, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: path })
            });
            const data = await response.json();
            if (data.success) {
                const visibleItems = data.items.filter(item => !Utils.isHiddenFile(item.name));
                this.displayItems(visibleItems, mediaType);
            } else {
                sliderContent.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle" style="margin-right: 10px;"></i>Ошибка: ${data.error}</div>`;
            }
        } catch (error) {
            sliderContent.innerHTML = `<div class="error"><i class="fas fa-exclamation-circle" style="margin-right: 10px;"></i>Ошибка загрузки: ${error.message}</div>`;
        }
        this.updateBackButton();
    },

    displayItems(items, mediaType = 'video') {
        const sliderContent = document.getElementById('sliderContent');
        sliderContent.innerHTML = '';

        if (items.length === 0) {
            sliderContent.innerHTML = '<div class="empty-message"><i class="fas fa-folder-open" style="margin-right: 10px;"></i>📁 Папка пуста</div>';
            return;
        }

        let displayItems = items;
        if (mediaType === 'audio') {
            displayItems = items.filter(item =>
                item.isDirectory || Utils.isAudioFile(item.name)
            );
        } else {
            displayItems = items.filter(item =>
                item.isDirectory || Utils.isVideoFile(item.name)
            );
        }

        displayItems.forEach(item => {
            const card = this.createItemCard(item, mediaType);
            sliderContent.appendChild(card);
        });

        this.sliderWrapper.scrollTop = 0;
        this.updateScrollIndicator();
    },

    createItemCard(item, mediaType) {
        const card = document.createElement('div');
        card.className = 'item-card';
        let icon = 'fa-file';
        let iconClass = 'file-icon';

        if (item.isDirectory) {
            icon = 'fa-folder';
            iconClass = 'folder-icon';
        } else {
            if (Utils.isVideoFile(item.name)) {
                icon = 'fa-file-video';
                iconClass = 'video-icon';
            } else if (Utils.isAudioFile(item.name)) {
                icon = 'fa-file-audio';
                iconClass = 'audio-icon';
            } else {
                icon = 'fa-file';
                iconClass = 'file-icon';
            }
        }

        card.innerHTML = `
            <i class="fas ${icon} ${iconClass}"></i>
            <div class="item-info">
                <div class="item-name" title="${item.name}">${item.name}</div>
                ${item.size ? `<div class="item-size">${Utils.formatFileSize(item.size)}</div>` : ''}
                <div class="item-path" title="${item.path}">${item.path}</div>
            </div>
        `;

        if (item.isDirectory) {
            card.onclick = () => this.loadDirectory(item.path, mediaType);
        } else {
            card.onclick = () => PlayerManager.playMedia(item.path);
        }

        return card;
    },

    updateScrollIndicator() {
        const scrollPercent = (this.sliderWrapper.scrollTop /
            (this.sliderWrapper.scrollHeight - this.sliderWrapper.clientHeight)) * 100;
        const indicatorBar = document.getElementById('scrollIndicatorBar');
        if (indicatorBar) {
            indicatorBar.style.height = scrollPercent + '%';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
