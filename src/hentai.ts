import * as cheerio from 'cheerio';
import * as iconv from 'iconv-lite';
import * as _ from 'lodash';
import * as rp from 'request-promise';
import { Album, Albums, Props, dumpAlbum } from './defines';

export class Hentai {
  protected retryCount: number = 5;
  protected _config: Props = {} as any;
  public set config(_config: Props) {
    this._config = _.assign({}, this._config, _config);
  }

  constructor() { }

  protected decodeStr(str: string): string {
    return iconv.decode(new Buffer(str), 'GB2312');
  }

  protected openUrl(url: string, depth = 0): Promise<CheerioStatic> {
    return new Promise((resolve, reject) => {
      rp(url, { encoding: null }).then((html: string) => {
        const $ = cheerio.load(this.decodeStr(html));
        resolve($);
      }).catch((err) => {
        //console.log(`Error (depth:${depth}) in ${url}`);
        if (depth > this.retryCount) {
          resolve(cheerio.load('<html><body></body></html>'));
          return;
        }
        resolve(this.openUrl(url, depth + 1));
      });
    });
  }

  protected appendBase(url: string): string {
    return `${this._config.baseUrl}${url}`;
  }

  protected extractListTotal($: CheerioStatic): number {
    if (this._config.listTotalSelector) {
      const totalEl = $(this._config.listTotalSelector).first();
      const total = Number((totalEl.text().match(/\d+/) || []).pop()) || 0;
      return total;
    }

    if (this._config.listLastSelector) {
      const lastEl = $(this._config.listLastSelector).last();
      const total = Number((lastEl.text().match(/\d+/g) || []).pop()) || 0;
      return total;
    }
    return 0;
  }

  protected extractAlbumBase(el: CheerioElement, listId: number): Album {
    return { list: listId } as any;
  }

  public extractRoot(): void {
    this.openUrl(`${this._config.baseUrl}${this._config.rootPath}`).then($ => {
      const total = this.extractListTotal($);
      _.times(total, i => this.extractList(i + 1));
    });
  }

  public extractList(listId: number): void {
    const listUrl = this._config.listTemplate.replace(/\$\{i\}/, `${listId}`);
    this.openUrl(this.appendBase(listUrl)).then($ => {
      const listEls = $(this._config.albumSelector);
      listEls.each((i, listEl) => {
        const album: Album = this.extractAlbumBase(listEl, listId);
        album.id !== 0 && this.extractAlbum(album);
      });
    });
  }

  public extractAlbumTotal($: CheerioStatic): number {
    if (this._config.albumTotalSelector) {
      const totalEl = $(this._config.albumTotalSelector).first();
      const total = Number((totalEl.text().match(/\d+/) || []).pop()) || 0;
      return total;
    }

    if (this._config.albumLastSelector) {
      const lastEl = $(this._config.albumLastSelector).last();
      const total = Number((lastEl.text().match(/\d+/g) || []).pop()) || 0;
      return total;
    }

    return 0;
  }

  public extractAlbum(album: Album): void {
    this.openUrl(this.appendBase(album.url)).then($ => {
      const title = $(this._config.albumTitleSelector).text() || album.title;
      album.total = this.extractAlbumTotal($);
      const imgUrl = $(this._config.imageSelector).attr('src');
      album.images.push(imgUrl);
      _.times(album.total - 1, (i) => {
        this.extractImage(album.url, i, (imgUrl: string) => {
          album.images[i + 1] = imgUrl;
          const validLen = album.images.filter(x => x).length;
          validLen >= album.total && this.downloadAlbum(album);
        });
      });
    });
  }

  protected extractImage(albumUrl: string, i: number, cb: Function): void {
    const pageUrl = albumUrl.replace(/\.html$/, `_${i + 2}.html`);
    this.openUrl(this.appendBase(pageUrl)).then($ => {
      const imgUrl = $(this._config.imageSelector).attr('src');
      imgUrl && cb && cb(imgUrl);
    });
  }

  protected downloadAlbum(album: Album): void {
    dumpAlbum(album);
  }
}
