import { Album } from './defines';
import { Hentai } from './hentai';

class MyHentai extends Hentai {
  protected decodeStr(str: string): string {
    return str;
  }

  protected extractListTotal($: CheerioStatic): number {
    const lastEl = $(this._config.listLastSelector).last();
    const total = Number((lastEl.attr('href').match(/\d+/g) || []).pop()) || 0;
    return total;
  }

  protected extractAlbumBase(el: CheerioElement, listId: number): Album {
    const album: Album = {
      id: 0,
      title: el.attribs.title || '',
      url: el.attribs.href || '',
      images: [],
      list: listId,
      total: 0,
    };
    album.id = Number((album.url.match(/\d+(?=\.html$)/) || [])[0]);
    return album;
  }
}

const obj = new MyHentai();
obj.config = {
  baseUrl: 'http://www.gkba.cc',
  rootPath: '/gongkou/list_4_1.html',
  listTemplate: '/gongkou/list_4_${i}.html',
  listLastSelector: '.pagelist a',
  albumSelector: '.pic-m >li >p >a',
  albumTitleSelector: '.info h1',
  albumTotalSelector: '.tg_pages >a',
  imageSelector: '.tcontent img',
};
//obj.extractRoot();
obj.extractList(1);
//obj.extractAlbum({ url: '/gongkou/7192.html', images: [] } as any);
