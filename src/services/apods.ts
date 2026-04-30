import { AWS_APODS_ENDPOINT, AWS_BASE_URL } from "../constants/config";

export async function getApod(date: string) {
  // Try getting the APOD first from the backend to see if we have it cached there from a previous fetch. If not, then fetch from the NASA API.
  let apodResponse = await fetch(
    AWS_BASE_URL + `${AWS_APODS_ENDPOINT}` + `/${date}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return apodResponse;
}

export async function fetchApodsFromBackend(date: string) {
  // Try getting the APOD from the backend.
  let apodResponse = await getApod(date);
  let data = await apodResponse.json();

  if (data != null && "message" in data) {
    data = data.message;
    const dateOnly = data.date.slice(0, 10);
    data.date = dateOnly; // Format the date to only include the date portion (YYYY-MM-DD) for consistency and display purposes.
  }

  return data;
}
