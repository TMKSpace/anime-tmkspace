type AddExclaminated<T extends string> = `!${T}` | T;

export interface Genre {
  // id: string;
  name: string;
  russian: string;
  // kind: string;
}

// Основная информация об аниме
export interface Anime {
  id: string;
  name: string;
  russian: string;
  url: string;
  kind: string;
  score: string;
  status: string;
  releasedOn: { date: string };
  studios: { name: string; imageUrl: string };
  genres: Genre[];
  // ... другие поля по необходимости
}

type AnimeSearchOrder =
  | "id"
  | "id_desc"
  | "ranked"
  | "kind"
  | "popularity"
  | "name"
  | "aired_on"
  | "episodes"
  | "status"
  | "random"
  | "ranked_random"
  | "ranked_shiki"
  | "created_at"
  | "created_at_desc";

type AnimeKindString = AddExclaminated<
  | "movie"
  | "music"
  | "ona"
  | "ova/ona"
  | "ova"
  | "special"
  | "tv"
  | "tv_13"
  | "tv_24"
  | "tv_48"
  | "tv_special"
  | "pv"
  | "cm"
>;

type AnimeStatusString = AddExclaminated<"anons" | "ongoing" | "released">;

export enum AnimeDurationEnum {
  less_than_10 = "S",
  less_than_30 = "D",
  more_than_30 = "F",
  not_less_than_10 = "!S",
  not_less_than_30 = "!D",
  not_more_than_30 = "!F"
}

type AnimeRating = AddExclaminated<"g" | "pg" | "pg_13" | "r" | "r_plus" | "rx">;

type AnimeOrigin = AddExclaminated<
  | "card_game"
  | "novel"
  | "radio"
  | "game"
  | "unknown"
  | "book"
  | "light_novel"
  | "web_novel"
  | "original"
  | "picture_book"
  | "music"
  | "manga"
  | "visual_novel"
  | "other"
  | "web_manga"
  | "four_koma_manga"
  | "mixed_media"
>;

type AnimeMyList = AddExclaminated<"planned" | "watching" | "rewatching" | "completed" | "on_hold" | "dropped">;

export interface AnimeSearchOptions {
  page?: number;
  limit?: number;
  order?: AnimeSearchOrder;
  kind?: AnimeKindString;
  status?: AnimeStatusString;
  season?: string;
  score?: number;
  duration?: AnimeDurationEnum;
  rating?: AnimeRating;
  origin?: AnimeOrigin;
  genre?: string;
  studio?: string;
  franchise?: string;
  censored?: boolean;
  mylist?: AnimeMyList;
  ids?: string;
  excludeIds?: string;
}
