import {
  AWS_BASE_URL,
  AWS_FAVORITES_ENDPOINT,
  AWS_USERS_ENDPOINT,
} from "../constants/config";

export async function getFavorites(
  userId: string | string[],
  userToken: string | null,
) {
  const getFavoriteResp = await fetch(
    AWS_BASE_URL + `${AWS_USERS_ENDPOINT}/${userId}${AWS_FAVORITES_ENDPOINT}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
    },
  );

  return getFavoriteResp;
}

export async function postFavorite(
  userId: string | string[],
  userToken: string | null,
  apodId: string | undefined,
) {
  const postFavoriteResp = await fetch(
    AWS_BASE_URL + `${AWS_USERS_ENDPOINT}/${userId}${AWS_FAVORITES_ENDPOINT}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        apod_id: apodId,
      }),
    },
  );

  return postFavoriteResp;
}

export async function deleteFavorite(
  userId: string | string[],
  userToken: string | null,
  favoriteId: number | null,
) {
  const deleteFavoriteResp = await fetch(
    AWS_BASE_URL +
      `${AWS_USERS_ENDPOINT}/${userId}${AWS_FAVORITES_ENDPOINT}/${favoriteId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
    },
  );

  return deleteFavoriteResp;
}
