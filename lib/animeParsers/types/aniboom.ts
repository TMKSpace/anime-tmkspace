// Interfaces for type safety
export interface FastSearchResult {
  title: string;
  year: string;
  other_title: string;
  type: string;
  link: string;
  animego_id: string;
}

export interface EpisodeInfo {
  index: number;
  title: string;
  date: string;
  status: "вышел" | "анонс";
  released: boolean;
}

export interface TranslationInfo {
  name: string;
  id: string;
}

export interface AnimeCharacter {
  name: string;
  link: string;
  voiceActor: {
    name: string;
    link: string;
  };
}

export interface OtherInfo {
  [key: string]: string | string[];
}

export interface AnimeInfo {
  title: string;
  other_titles: string[];
  animego_id: string;
  link: string;

  nextEpisode?: { date: string; in: string; episode: string };
  episodes: { current: number; total: number };
  episodesList: EpisodeInfo[];

  type: string;
  status: string;
  genres: string[];
  source: string;
  season: string;
  releaseDate: string;
  studio: { name: string; link: string };
  ratings: { mpaa: string; ageRestriction: string };
  duration: string;
  basedOn: { type: string; title: string; link: string };

  description: string;
  mainCharacters: AnimeCharacter[];

  translations: TranslationInfo[];
  screenshots: string[];
  poster: string;
  trailer?: string;
}
