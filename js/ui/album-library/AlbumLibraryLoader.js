export class AlbumLibraryLoader {
  constructor(api, state) {
    this.api = api;
    this.state = state;
    this.PARALLEL_LIMIT = 5;
  }

  async loadArtistsAndFirstAlbums() {
    if (this.state.loading || this.state.isDestroyed) return;
    this.state.loading = true;
    this.state.artistsList = await this.api.getArtists();
    if (
      !this.state.artistsList ||
      this.state.artistsList.length === 0 ||
      this.state.isDestroyed
    ) {
      this.state.loading = false;
      return false;
    }
    this.state.albums = [];
    this.state.filteredAlbums = [];
    this.state.currentArtistIndex = 0;
    this.state.currentArtist = this.state.artistsList[0];
    await this.loadMoreAlbums();
    this.state.loading = false;
    return true;
  }

  async loadMoreAlbums() {
    if (this.state.isLoadingMore || this.state.isDestroyed) return;
    this.state.isLoadingMore = true;
    while (this.state.currentArtistIndex < this.state.artistsList.length) {
      const batchArtists = this.state.artistsList.slice(
        this.state.currentArtistIndex,
        this.state.currentArtistIndex + this.PARALLEL_LIMIT,
      );
      const batchResults = await Promise.all(
        batchArtists.map((artist) =>
          this.api.getAlbumsPaginated(
            artist,
            this.state.currentPage,
            this.state.pageSize,
          ),
        ),
      );
      const allAlbums = [];
      for (const result of batchResults) {
        if (result.albums) allAlbums.push(...result.albums);
      }
      const albumsWithCovers = await Promise.all(
        allAlbums.map(async (albumData) => {
          const key = `${albumData.artist}|${albumData.album}`;
          if (
            !this.state.albums.some((a) => `${a.artist}|${a.title}` === key)
          ) {
            const coverUrl = await this.api.fetchAlbumCover(
              albumData.album,
              albumData.artist,
            );
            return new Album({
              title: albumData.album,
              artist: albumData.artist,
              year: albumData.year,
              tracks: [],
              coverUrl,
            });
          }
          return null;
        }),
      );
      for (const album of albumsWithCovers) {
        if (album) this.state.albums.push(album);
      }
      this.state.filteredAlbums = [...this.state.albums];
      let hasNext = false;
      for (const result of batchResults) {
        if (result.pagination && result.pagination.hasNext) {
          hasNext = true;
          break;
        }
      }
      if (hasNext) {
        this.state.currentPage++;
        this.state.isLoadingMore = false;
        return true;
      }
      this.state.currentArtistIndex += this.PARALLEL_LIMIT;
      this.state.currentPage = 1;
    }
    this.state.isLoadingMore = false;
    return false;
  }

  async refresh() {
    this.state.reset();
    return this.loadArtistsAndFirstAlbums();
  }
}
