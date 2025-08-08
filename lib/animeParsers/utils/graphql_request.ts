import axios from "axios";
import type { GraphQLResponse } from "graphql-request";

export async function request<T>(url: string, query: string): Promise<GraphQLResponse<T>> {
  try {
    const response = await axios.post<GraphQLResponse<T>>(
      url,
      { query },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "TMKSpaceAnimeClient"
        }
      }
    );

    if (response.data.errors) {
      response.data.errors.forEach((error) => {
        console.error(error);
      });
      throw new Error(response.data.errors[0].message);
    }

    return response.data;
  } catch (error) {
    console.error("GraphQL request failed:", error);
    throw error;
  }
}
