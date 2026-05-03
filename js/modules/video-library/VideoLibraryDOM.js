// js/modules/video-library/VideoLibraryDOM.js
export class VideoLibraryDOM {
  constructor() {
    this.container = document.getElementById("videoContent");
    this.breadcrumbs = document.getElementById("videoBreadcrumbs");
  }

  showLoading() {
    if (this.container) {
      this.container.innerHTML =
        '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>';
    }
  }

  showError(message) {
    if (this.container) {
      this.container.innerHTML = `<div class="empty"><i class="fas fa-exclamation-triangle"></i> ${this._escape(message)}</div>`;
    }
  }

  showEmpty() {
    if (this.container) {
      this.container.innerHTML =
        '<div class="empty"><i class="fas fa-folder-open"></i> Папка пуста</div>';
    }
  }

  renderItems(items, renderer) {
    const visibleItems = items.filter((item) => !item.name.startsWith("."));
    if (visibleItems.length === 0) {
      this.showEmpty();
      return;
    }
    this.container.innerHTML = renderer(visibleItems);
  }

  updateBreadcrumbs(parts, onRootClick, onCrumbClick) {
    if (!this.breadcrumbs) return;
    this.breadcrumbs.innerHTML = "";
    const rootBreadcrumb = document.createElement("div");
    rootBreadcrumb.className = "breadcrumb-root";
    rootBreadcrumb.innerHTML =
      '<i class="fas fa-film"></i><span>Главная</span>';
    rootBreadcrumb.addEventListener("click", onRootClick);
    this.breadcrumbs.appendChild(rootBreadcrumb);
    for (let i = 0; i < parts.length; i++) {
      const crumb = document.createElement("div");
      crumb.className = "breadcrumb";
      crumb.innerHTML = `<i class="fas fa-folder"></i><span class="breadcrumb-text" title="${this._escape(parts[i].name)}">${this._escape(parts[i].name)}</span>`;
      if (i === parts.length - 1) {
        crumb.classList.add("active");
      } else {
        crumb.addEventListener("click", (e) => {
          e.stopPropagation();
          onCrumbClick(parts[i].path);
        });
      }
      this.breadcrumbs.appendChild(crumb);
    }
  }

  adjustBottomPadding() {
    setTimeout(() => {
      const player = document.querySelector(".universal-bottom-player");
      const contentGrid = this.container;
      if (player && player.classList.contains("active") && contentGrid) {
        const playerHeight = player.offsetHeight;
        contentGrid.style.paddingBottom = playerHeight + 20 + "px";
      } else if (contentGrid) {
        if (window.innerWidth <= 768) {
          contentGrid.style.paddingBottom = "150px";
        } else if (window.innerWidth <= 480) {
          contentGrid.style.paddingBottom = "170px";
        } else {
          contentGrid.style.paddingBottom = "100px";
        }
      }
    }, 100);
  }

  getContainer() {
    return this.container;
  }

  _escape(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}
