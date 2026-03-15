const TreeManager = {
    treeContainer: null,
    currentPath: CONFIG.ROOT_PATH,
    init() {
        this.treeContainer = document.getElementById('treeContainer');
    },
    async loadTreeData() {
        if (!this.treeContainer) return;
        this.treeContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--fg3);">Загрузка дерева папок...</div>';
        try {
            const response = await fetch(CONFIG.API_ENDPOINTS.LIST, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: CONFIG.ROOT_PATH })
            });
            const data = await response.json();
            if (data.success) {
                this.buildTree(data.items);
            } else {
                this.showError('Ошибка загрузки дерева');
            }
        } catch (error) {
            this.showError(`Ошибка: ${error.message}`);
        }
    },
    buildTree(items) {
        if (!this.treeContainer) return;
        const folders = items.filter(item => item.isDirectory && !Utils.isHiddenFile(item.name));
        if (folders.length === 0) {
            this.treeContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--fg3);">Нет папок</div>';
            return;
        }
        let html = '<div class="tree-root">';
        html += `
            <div class="tree-item" data-path="${CONFIG.ROOT_PATH}">
                <div class="tree-item-content ${this.currentPath === CONFIG.ROOT_PATH ? 'active' : ''}"
                     onclick="TreeManager.navigateFromTree('${CONFIG.ROOT_PATH}')">
                    <i class="fas fa-folder-open"></i>
                    <span>mnt/video</span>
                </div>
                <div class="tree-children">
        `;
        folders.forEach(folder => {
            html += `
                <div class="tree-item" data-path="${folder.path}">
                    <div class="tree-item-content ${this.currentPath === folder.path ? 'active' : ''}"
                         onclick="TreeManager.navigateFromTree('${folder.path}')">
                        <i class="fas fa-folder"></i>
                        <span title="${folder.path}">${folder.name}</span>
                    </div>
                </div>
            `;
        });
        html += '</div></div></div>';
        this.treeContainer.innerHTML = html;
    },
    navigateFromTree(path) {
        this.currentPath = path;
        App.loadDirectory(path);
        document.querySelectorAll('.tree-item-content').forEach(el => {
            el.classList.remove('active');
        });
        const activeItem = document.querySelector(`.tree-item[data-path="${path}"] .tree-item-content`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        if (window.innerWidth <= 768) {
            document.getElementById('leftPanel').classList.remove('visible');
        }
    },
    showError(message) {
        if (this.treeContainer) {
            this.treeContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--red);">${message}</div>`;
        }
    },
    updateActiveItem(path) {
        this.currentPath = path;
        if (document.getElementById('leftPanel').classList.contains('visible')) {
            document.querySelectorAll('.tree-item-content').forEach(el => {
                el.classList.remove('active');
            });
            const activeItem = document.querySelector(`.tree-item[data-path="${path}"] .tree-item-content`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }
    }
};
