const App = {
    currentPage: 'video',

    init() {
        this.setupNavigation();

        VideoExplorer.init();
        AlbumLibrary.init();
        AudioPlayer.init();

        this.showPage('video');
    },

    setupNavigation() {
        document.getElementById('navVideo').addEventListener('click', () => {
            this.showPage('video');
        });

        document.getElementById('navAudio').addEventListener('click', () => {
            this.showPage('audio');
        });
    },

    showPage(page) {
        this.currentPage = page;

        document.getElementById('pageVideo').classList.toggle('hidden', page !== 'video');
        document.getElementById('pageAudio').classList.toggle('hidden', page !== 'audio');

        document.getElementById('navVideo').classList.toggle('active', page === 'video');
        document.getElementById('navAudio').classList.toggle('active', page === 'audio');

        if (page === 'audio') {
            AlbumLibrary.renderAlbums();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
