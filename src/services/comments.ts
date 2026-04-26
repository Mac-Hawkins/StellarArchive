import {
    AWS_APODS_ENDPOINT,
    AWS_AUTHORIZATION,
    AWS_BASE_URL,
    AWS_COMMENTS_ENDPOINT,
} from "../constants/config";

export async function getComments(apodId: number) {
  try {
    const commentsResponse = await fetch(
      AWS_BASE_URL +
        `${AWS_APODS_ENDPOINT}` +
        `/${apodId}` +
        `${AWS_COMMENTS_ENDPOINT}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${AWS_AUTHORIZATION}`,
        },
      },
    );
    const commentsData = await commentsResponse.json();
    return commentsData;
  } catch (error) {
    console.error("Error fetching comments for APOD.");
    return null;
  }
}

export async function postComment(
  apodId: number | undefined,
  userId: string | string[],
  userToken: string | string[],
  comment: string,
  parentCommentId: number | null,
) {
  const commentsResponse = await fetch(
    AWS_BASE_URL +
      `${AWS_APODS_ENDPOINT}` +
      `/${apodId}` +
      `${AWS_COMMENTS_ENDPOINT}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        userId: userId,
        message: comment,
        parentCommentId: parentCommentId, // This can be null if it's a top-level comment, or it can be the id of the comment being replied to for nested comments.
      }),
    },
  );

  return commentsResponse;
}
