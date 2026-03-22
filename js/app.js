const App = {
    currentPage: 'video',
    async init() {
        this.setupNavigation();

        // Сначала показываем страницу видео, чтобы интерфейс был активным
        this.showPage('video');

        // Затем инициализируем все модули параллельно
        try {
            // Запускаем инициализацию всех модулей без ожидания друг друга
            VideoExplorer.init();
            AlbumLibrary.init(); // не ждем завершения
            AudioPlayer.init();
            PlayerManager.init();
        } catch (error) {
            console.error('Error initializing modules:', error);
        }

        this.setupMobileMenu();
    },
    setupNavigation() {
        const navVideo = document.getElementById('navVideo');
        const navAudio = document.getElementById('navAudio');
        if (navVideo) navVideo.addEventListener('click', () => this.showPage('video'));
        if (navAudio) navAudio.addEventListener('click', () => this.showPage('audio'));
    },
    showPage(page) {
        this.currentPage = page;
        const pageVideo = document.getElementById('pageVideo');
        const pageAudio = document.getElementById('pageAudio');
        const navVideo = document.getElementById('navVideo');
        const navAudio = document.getElementById('navAudio');

        if (pageVideo) pageVideo.classList.toggle('hidden', page !== 'video');
        if (pageAudio) pageAudio.classList.toggle('hidden', page !== 'audio');
        if (navVideo) navVideo.classList.toggle('active', page === 'video');
        if (navAudio) navAudio.classList.toggle('active', page === 'audio');

        // При переходе на аудио, если альбомы уже загружены, показываем их
        if (page === 'audio') {
            // Скрываем плеер если он был показан
            const audioPlayerBar = document.getElementById('audioPlayerBar');
            if (audioPlayerBar && !AudioPlayer.currentAlbum) {
                audioPlayerBar.style.display = 'none';
            }

            // Рендерим альбомы если они есть
            if (AlbumLibrary.filteredAlbums && AlbumLibrary.filteredAlbums.length > 0) {
                AlbumLibrary.renderAlbums();
            } else if (AlbumLibrary.albums && AlbumLibrary.albums.length > 0) {
                AlbumLibrary.filteredAlbums = [...AlbumLibrary.albums];
                AlbumLibrary.renderAlbums();
            } else if (AlbumLibrary.artists.length === 0) {
                // Если данные еще не загружены, загружаем
                AlbumLibrary.loadArtists();
            }
        }

        // При переходе на видео, обновляем содержимое если оно пустое
        if (page === 'video') {
            const videoContent = document.getElementById('videoContent');
            // Проверяем, что контент еще не загружен или показывает ошибку/пустоту
            if (videoContent && (videoContent.innerHTML.includes('Загрузка') ||
                videoContent.innerHTML.includes('Ошибка') ||
                videoContent.children.length === 0)) {
                VideoExplorer.loadDirectory(VideoExplorer.currentPath);
            }
        }
    },
    setupMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const toggleMenu = () => {
            if (sidebar) sidebar.classList.toggle('open');
            if (sidebarOverlay) sidebarOverlay.classList.toggle('open');
        };
        if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleMenu);
        document.querySelectorAll('.sidebar-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    toggleMenu();
                }
            });
        });
    },
    loadDirectory(path, mediaType) {
        if (mediaType === 'video' && typeof VideoExplorer !== 'undefined') {
            VideoExplorer.loadDirectory(path, true);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
