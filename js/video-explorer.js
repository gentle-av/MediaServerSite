const VideoExplorer = {
    currentPath: '/mnt/video',
    history: [],

    async init() {
        await this.loadDirectory(this.currentPath);
        this.setupEventListeners();
    },

    setupEventListeners() {
        document.getElementById('videoBackBtn').addEventListener('click', () => this.goBack());
    },

    async loadDirectory(path) {
        if (this.currentPath !== path && this.currentPath) {
            this.history.push(this.currentPath);
        }
        this.currentPath = path;
        this.updateBackButton();
        this.updateBreadcrumbs();

        const content = document.getElementById('videoContent');
        content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>';

        try {
            const response = await fetch(`http://${window.location.hostname}:8083/api/list`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: path })
            });
            const data = await response.json();

            if (data.success) {
                this.renderContent(data.items);
            } else {
                content.innerHTML = `<div class="empty"><i class="fas fa-exclamation-triangle"></i> ${data.error || 'Ошибка загрузки'}</div>`;
            }
        } catch (error) {
            console.error('Error loading directory:', error);
            content.innerHTML = '<div class="empty"><i class="fas fa-wifi"></i> Ошибка подключения к серверу</div>';
        }
    },

    renderContent(items) {
        const content = document.getElementById('videoContent');
        const visibleItems = items.filter(item => !Utils.isHiddenFile(item.name));

        if (visibleItems.length === 0) {
            content.innerHTML = '<div class="empty"><i class="fas fa-folder-open"></i> Папка пуста</div>';
            return;
        }

        content.innerHTML = visibleItems.map(item => `
            <div class="item-card" data-path="${item.path}" data-is-dir="${item.isDirectory}">
                <i class="fas ${item.isDirectory ? 'fa-folder folder-icon' : 'fa-file-video video-icon'}"></i>
                <div class="item-name" title="${Utils.escapeHtml(item.name)}">${Utils.escapeHtml(item.name)}</div>
                ${!item.isDirectory ? `<div class="item-size">${item.size || ''}</div>` : ''}
            </div>
        `).join('');

        document.querySelectorAll('.item-card').forEach(card => {
            card.addEventListener('click', () => {
                const path = card.dataset.path;
                const isDir = card.dataset.isDir === 'true';

                if (isDir) {
                    this.loadDirectory(path);
                } else {
                    this.playVideo(path);
                }
            });
        });
    },

    async playVideo(path) {
        try {
            if (typeof PlayerManager !== 'undefined') {
                await PlayerManager.playMedia(path);
            } else {
                const response = await fetch(`http://${window.location.hostname}:8083/api/open`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: path })
                });
                const data = await response.json();
                if (data.success) {
                    Utils.showNotification(`Воспроизведение: ${path.split('/').pop()}`, 'success');
                } else {
                    Utils.showNotification(data.error || 'Ошибка воспроизведения', 'error');
                }
            }
        } catch (error) {
            console.error('Error playing video:', error);
            Utils.showNotification('Ошибка подключения к серверу', 'error');
        }
    },

    goBack() {
        if (this.history.length > 0) {
            const previousPath = this.history.pop();
            this.loadDirectory(previousPath);
        }
        this.updateBackButton();
    },

    updateBackButton() {
        const backBtn = document.getElementById('videoBackBtn');
        backBtn.disabled = this.history.length === 0;
    },

    updateBreadcrumbs() {
        const breadcrumbs = document.getElementById('videoBreadcrumbs');
        breadcrumbs.innerHTML = '';

        const rootPath = '/mnt/video';
        const parts = this.currentPath.substring(rootPath.length).split('/').filter(p => p);

        const rootBreadcrumb = document.createElement('div');
        rootBreadcrumb.className = 'breadcrumb';
        rootBreadcrumb.innerHTML = '<i class="fas fa-home"></i> video';
        rootBreadcrumb.addEventListener('click', () => this.loadDirectory(rootPath));
        breadcrumbs.appendChild(rootBreadcrumb);

        let currentPath = rootPath;
        for (const part of parts) {
            currentPath += '/' + part;
            const crumb = document.createElement('div');
            crumb.className = 'breadcrumb';
            crumb.innerHTML = part;
            crumb.addEventListener('click', () => this.loadDirectory(currentPath));
            breadcrumbs.appendChild(crumb);
        }
    }
};
