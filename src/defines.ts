export interface Album {
  id: number;
  list: number;
  url: string;
  title: string;
  total: number;
  images: string[];
}

export interface Albums {
  [key: number]: Album;
}

export interface Props {
  baseUrl: string;
  rootPath: string;
  listTotalSelector?: string;
  listLastSelector?: string;
  listTemplate: string;
  albumSelector: string;
  albumTitleSelector: string;
  albumTotalSelector?: string;
  albumLastSelector?: string;
  imageSelector: string;
}

export const dumpAlbum = (album: Album) => console.log(`${album.list}:${album.id}:${album.url}:${album.total}:${album.title}`);
