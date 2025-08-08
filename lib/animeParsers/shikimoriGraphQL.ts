import type { GraphQLResponse } from "graphql-request";
import type { Anime, AnimeSearchOptions } from "./types/shikimori";
import { request } from "./utils/graphql_request";

export class ShikimoriGraphQL {
  private readonly domain: string;
  private readonly graphql_url: string;

  constructor(domain: string = "shikimori.one") {
    this.domain = domain;
    this.graphql_url = `https://${domain}/api/graphql`;
  }

  async searchAnime(
    title: string,
    options: AnimeSearchOptions = { limit: 10 }
  ): Promise<GraphQLResponse<{ animes: Anime[] }>> {
    if (!options.limit) options.limit = 10;

    const options_string = Object.entries(options)
      .map(([k, v]) => (k == "order" || typeof v != "string" ? [k, v] : [k, `"${v}"`]))
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const query = `
      {
        animes(search: "${title}", ${options_string}) {
          id
          name
          russian
          url
          kind
          score
          status
          releasedOn { date }
          studios { name imageUrl }
          genres {
            name
            russian
          }
        }
      }
    `;

    return request(this.graphql_url, query);
  }
}
