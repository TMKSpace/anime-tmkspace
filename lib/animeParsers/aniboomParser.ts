import axios from "axios";
import * as cheerio from "cheerio";
import type { AnimeCharacter, AnimeInfo, EpisodeInfo, FastSearchResult, TranslationInfo } from "./types/aniboom";

class ContentBlocked extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentBlocked";
  }
}

export default class AniboomParser {
  private requests;
  private domain: string;

  constructor(mirror?: string) {
    this.requests = axios.create();
    this.domain = mirror || "animego.org";
  }

  async fastSearch(title: string): Promise<FastSearchResult[]> {
    const headers = {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `https://${this.domain}/`
    };

    const params = {
      type: "small",
      q: title
    };

    const response = await this.requests.get(`https://${this.domain}/search/all`, { params, headers });
    const data = response.data;

    if (data.status !== "success") {
      throw new Error(
        `ServiceError: На запрос "${title}" сервер не вернул ожидаемый ответ "status: success". Status: "${data.status}"`
      );
    }

    const $ = cheerio.load(data.content);
    const results: FastSearchResult[] = [];

    $("div.result-search-anime div.result-search-item").each((_, elem) => {
      const $elem = $(elem);
      const anime: FastSearchResult = {
        title: $elem.find("h5").text().trim(),
        year: $elem.find("span.anime-year").text().trim(),
        other_title: $elem.find("div.text-truncate").text().trim() || "",
        type: $elem.find('a[href*="anime/type"]').text().trim(),
        link: `https://${this.domain}` + $elem.find("h5 a").attr("href"),
        animego_id: ""
      };
      anime.animego_id = anime.link.slice(anime.link.lastIndexOf("-") + 1);
      results.push(anime);
    });

    return results;
  }

  async search(title: string): Promise<AnimeInfo[]> {
    const elements = await this.fastSearch(title);
    const res: AnimeInfo[] = [];

    for (const anime of elements) {
      const animeData = await this.animeInfo(anime.link);
      res.push(animeData);
    }

    return res;
  }

  async getEpisodes(link: string): Promise<EpisodeInfo[]> {
    const headers = {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest"
    };

    const params = {
      type: "episodeSchedule",
      episodeNumber: "99999"
    };

    const response = await this.requests.get(link, { headers, params });
    const data = response.data;

    if (data.status !== "success") {
      throw new Error(`NoResults: По запросу данных эпизодов link "${link}" ничего не найдено`);
    }

    const $ = cheerio.load(data.content);
    const episodes_list: EpisodeInfo[] = [];

    $("div.row.m-0").each((_, ep) => {
      const $ep = $(ep);
      const items = $ep
        .find("div")
        .toArray()
        .map((el) => $(el));

      const index = items[0].find("meta").attr("content") || "";
      const ep_title = items[1].text().trim() || "";
      const ep_date = items[2].find("span").attr("data-label") || "";
      const ep_status = items[3].find("span").length ? "вышел" : "анонс";

      episodes_list.push({
        index: index ? parseInt(index) : -1,
        title: ep_title,
        date: ep_date,
        status: ep_status,
        released: ep_status == "вышел"
      });
    });

    return episodes_list.sort((a, b) => a.index - b.index);
  }

  async animeInfo(link: string): Promise<AnimeInfo> {
    const response = await this.requests.get(link);
    if (response.status !== 200) {
      throw new Error(`ServiceError: Сервер не вернул ожидаемый код 200. Код: "${response.status}"`);
    }

    const $ = cheerio.load(response.data);
    let anime: Partial<AnimeInfo> = {
      link,
      animego_id: link.slice(link.lastIndexOf("-") + 1),
      title: $("div.anime-title h1").text().trim()
    };

    // Other titles
    $("div.anime-synonyms li").each((_, syn) => {
      anime.other_titles!.push($(syn).text().trim());
    });

    // Poster URL
    const posterSrc = $("img").first().attr("src") || "";
    anime.poster = `https://${this.domain}` + posterSrc.substring(posterSrc.indexOf("/upload"));

    // Anime info
    const animeInfo = $("div.anime-info dl");

    function get_value(key: string) {
      return animeInfo.find(`dt:contains("${key}")`)?.next("dd");
    }

    anime.status = get_value("Статус").text().trim();
    anime.genres = get_value("Жанр")
      .find("a")
      .map((i, el) => animeInfo.find(el).text().trim())
      .get();
    anime.source = get_value("Первоисточник")?.text().trim();
    anime.season = get_value("Сезон")?.text().trim();
    anime.releaseDate = get_value("Выпуск").find("span").first().text().trim();

    // Next episode
    const next_ep = get_value("Следующий эпизод");
    if (next_ep.text()) {
      anime.nextEpisode = {
        date: next_ep.find("span").first().text().trim(),
        in: next_ep.find("span").first().attr("data-title")!,
        episode: next_ep.find("span.d-none").text().trim()
      };
    }
    anime.type = get_value("Тип").text().trim();

    // Total episodes counter
    const episodes = get_value("Эпизоды");
    const current = episodes.text().split("/")[0].trim();
    anime.episodes = {
      current: parseInt(current),
      total: parseInt(episodes.find("span")?.text().trim() || current)
    };

    // Studio
    const studio = get_value("Студия").find("a");
    anime.studio = {
      name: studio.text().trim(),
      link: studio.attr("href")!
    };

    // Based on
    const basedOn = get_value("Снят по").find("a");
    anime.basedOn = {
      type: anime.source,
      title: basedOn.text().trim(),
      link: basedOn.attr("href")!
    };

    // Main Characters
    anime.mainCharacters = get_value("Главные герои")
      .find("div")
      .map((i, el) => {
        const element = animeInfo.find(el);
        const char = element.find("a").first();
        const va = element.find("a.text-link-gray");

        return {
          name: char.text().trim(),
          link: char.attr("href")!,
          voiceActor: {
            name: va.text().trim(),
            link: va.attr("href")!
          }
        } as AnimeCharacter;
      })
      .get();

    // Description
    anime.description = $("div.description").text().trim();

    // Screenshots
    anime.screenshots = [];
    $("a.screenshots-item").each((_, screenshot) => {
      const href = $(screenshot).attr("href");
      if (href) {
        anime.screenshots!.push(`https://${this.domain}` + href);
      }
    });

    // Trailer
    const trailerCont = $("div.video-block");
    if (trailerCont.length) {
      anime.trailer = trailerCont.find("a.video-item").attr("href");
    }

    // Episodes info
    anime.episodesList = await this.getEpisodes(link);

    // Translations
    try {
      anime.translations = await this.getTranslationsInfo(anime.animego_id!);
    } catch (e) {
      if (e instanceof ContentBlocked) {
        anime.translations = [];
      } else {
        throw e;
      }
    }

    return anime as AnimeInfo;
  }

  async getTranslationsInfo(animego_id: string): Promise<TranslationInfo[]> {
    const headers = {
      "X-Requested-With": "XMLHttpRequest"
    };

    const params = {
      _allow: "true"
    };

    const response = await this.requests.get(`https://${this.domain}/anime/${animego_id}/player`, { params, headers });
    if (response.status !== 200) {
      throw new Error(`ServiceError: Сервер не вернул ожидаемый код 200. Код: "${response.status}"`);
    }

    const data = response.data;
    const $ = cheerio.load(data.content);

    if ($("div.player-blocked").length) {
      const reason = $("div.h5").text() || "Не известно";
      throw new ContentBlocked(`Контент по id ${animego_id} заблокирован. Причина блокировки: "${reason}"`);
    }

    const translationsContainer = $("#video-dubbing span.video-player-toggle-item");
    const playersContainer = $("#video-players span.video-player-toggle-item");

    // console.log($.html());

    const translations: Record<string, { name: string; id?: string }> = {};

    translationsContainer.each((_, translation) => {
      const $translation = $(translation);
      const dubbing = $translation.attr("data-dubbing") || "";
      const name = $translation.text().trim();
      translations[dubbing] = { name };
    });

    playersContainer.each((_, player) => {
      const $player = $(player);
      if ($player.attr("data-provider") === "24") {
        const dubbing = $player.attr("data-provide-dubbing") || "";
        const translation_id = ($player.attr("data-player") || "").split("=").pop() || "";

        if (translations[dubbing]) {
          translations[dubbing].id = translation_id;
        }
      }
    });

    const res: TranslationInfo[] = [];
    for (const translation of Object.values(translations)) {
      if (translation.name && translation.id) {
        res.push({
          name: translation.name,
          id: translation.id
        });
      }
    }

    return res;
  }

  async getEmbedLink(animego_id: string): Promise<string> {
    const headers = {
      "X-Requested-With": "XMLHttpRequest"
    };

    const params = {
      _allow: "true"
    };

    const response = await this.requests.get(`https://${this.domain}/anime/${animego_id}/player`, { params, headers });
    if (response.status !== 200) {
      throw new Error(`ServiceError: Сервер не вернул ожидаемый код 200. Код: "${response.status}"`);
    }

    const data = response.data;
    if (data.status !== "success") {
      throw new Error(`UnexpectedBehavior: Сервер не вернул ожидаемый статус "success". Статус: "${data.status}"`);
    }

    const $ = cheerio.load(data.content);
    if ($("div.player-blocked").length) {
      const reason = $("div.h5").text() || "Не известно";
      throw new ContentBlocked(`Контент по id ${animego_id} заблокирован. Причина блокировки: "${reason}"`);
    }

    const link = $("#video-players");
    const aniboomLink = link.find('span.video-player-toggle-item[data-provider="24"]').attr("data-player");

    if (!aniboomLink) {
      throw new Error(`NoResults: Для указанного id "${animego_id}" не удалось найти aniboom embed_link`);
    }

    return "https:" + aniboomLink.split("?")[0];
  }

  async getEmbed(embed_link: string, episode: number, translation: string): Promise<string> {
    const headers = {
      Referer: `https://${this.domain}/`
    };

    const params: any = {
      translation: translation
    };

    if (episode !== 0) {
      params.episode = episode;
    }

    const response = await this.requests.get(embed_link, { headers, params });
    if (response.status !== 200) {
      throw new Error(`ServiceError: Сервер не вернул ожидаемый код 200. Код: "${response.status}"`);
    }

    return response.data;
  }

  async getMediaSrc(embed_link: string, episode: number, translation: string): Promise<string> {
    const embed = await this.getEmbed(embed_link, episode, translation);
    const $ = cheerio.load(embed);

    const data = JSON.parse($("#video").attr("data-parameters") || "{}");
    const media_src = JSON.parse(data.dash).src;
    return media_src;
  }

  async getMediaServer(embed_link: string, episode: number, translation: string): Promise<string> {
    const src = await this.getMediaSrc(embed_link, episode, translation);
    return src.substring(0, src.lastIndexOf("/") + 1);
  }

  async getMediaServerFromSrc(media_src: string): Promise<string> {
    return media_src.substring(0, media_src.lastIndexOf("/") + 1);
  }

  private async getMpdPlaylistFromLink(embed_link: string, episode: number, translation_id: string): Promise<string> {
    const media_src = await this.getMediaSrc(embed_link, episode, translation_id);
    const host = new URL(embed_link).host;

    const headers = {
      Origin: `https://${host}`,
      Referer: `https://${host}/`,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    };

    try {
      const playlistResponse = await this.requests.get(media_src, {
        headers,
        responseType: "text" // Ensure we get text response
      });

      let playlist: string = playlistResponse.data;

      // Fix relative URLs in the MPD file
      const servername = await this.getMediaServerFromSrc(media_src);
      const filename = media_src.substring(servername.length);
      const name = filename.substring(0, filename.lastIndexOf("."));

      playlist = playlist.replaceAll(name, servername + name);

      return playlist;
    } catch (error) {
      throw new Error(
        `ServiceError: Failed to fetch MPD playlist: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getMpdPlaylist(animego_id: string, episode: number, translation_id: string): Promise<string> {
    const embed_link = await this.getEmbedLink(animego_id);
    return this.getMpdPlaylistFromLink(embed_link, episode, translation_id);
  }

  // async get_as_file(animego_id: string, episode: number, translation_id: string, filename: string): Promise<void> {
  //   const data = await this.get_mpd_playlist(animego_id, episode, translation_id);
  //   fs.writeFileSync(filename, data, "utf-8");
  // }
}

function normalizeFilename(string: string) {
  return (
    string
      .replace(/[\\/:*?"<>|]/g, "")
      // .replace(/\s/g, "-")
      // .toLowerCase()
      .substring(0, 240)
  );
}

import fs from "fs";

const e = new AniboomParser("animego.me");

const links = ["https://animego.me/anime/podnyatie-urovnya-v-odinochku-s1-2477"];

e.animeInfo(links[0]).then(async (anime) => {
  const basepath = anime.title;
  anime.translations.forEach(async (translation) => {
    let path = `${basepath}/${translation.name}`;

    await fs.promises.mkdir(path, { recursive: true }).catch(() => {});

    anime.episodesList.forEach(async (ep) => {
      const mpd = await e.getMpdPlaylist(anime.animego_id, ep.index, translation.id);
      const filename = `${ep.index}. ${ep.title}.mpd`;

      fs.promises
        .writeFile(`${path}/${normalizeFilename(filename)}`, mpd)
        .catch((err) => {
          console.log(`Не удалось записать серию ${ep.index} ${ep.title} (${translation.name}):`, err.message);
        })
        .then(() => {
          console.log(`Серия ${ep.index} ${ep.title} (${translation.name}) записана.`);
        });
    });
  });
});
