import { AlbumLibraryState } from "./AlbumLibraryState.js";
import { AlbumLibraryLoader } from "./AlbumLibraryLoader.js";
import { AlbumLibraryRenderer } from "./AlbumLibraryRenderer.js";
import { AlbumLibrarySearch } from "./AlbumLibrarySearch.js";
import { AlbumLibraryScroll } from "./AlbumLibraryScroll.js";
import { AlbumLibraryEvents } from "./AlbumLibraryEvents.js";

export class AlbumLibrary {
  constructor(musicApi, events) {
    this.api = musicApi;
    this.events = events;
    this.container = document.getElementById("albumsGrid");
    this.state = new AlbumLibraryState();
    this.loader = new AlbumLibraryLoader(this.api, this.state);
    this.renderer = new AlbumLibraryRenderer(
      this.container,
      this.events,
      this.state,
    );
    this.search = new AlbumLibrarySearch(this.state, this.renderer);
    this.scroll = new AlbumLibraryScroll(
      this.loader,
      this.renderer,
      this.state,
    );
    this.eventsHandler = new AlbumLibraryEvents(
      this.api,
      this.events,
      this.state,
      this.loader,
      this.renderer,
      () => this.refresh(),
    );
  }

  async init() {
    this.renderer.showLoading();
    await this.loader.loadArtistsAndFirstAlbums();
    this.state.indexTracks();
    this.renderer.renderAlbums();
    this.eventsHandler.bind();
    this.scroll.init();
  }

  getMetadataByPath(path) {
    return this.state.getMetadataByPath(path);
  }

  async refresh() {
    this.renderer.clear();
    this.renderer.showLoading();
    await this.loader.refresh();
    this.state.indexTracks();
    this.search.reset();
    this.renderer.renderAlbums();
  }

  searchAlbums(term) {
    this.search.search(term);
  }

  destroy() {
    this.state.destroy();
    this.scroll.destroy();
    this.eventsHandler.unbind();
    this.renderer.clear();
  }
}
