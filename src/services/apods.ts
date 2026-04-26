import {
    API_KEY,
    AWS_APODS_ENDPOINT,
    AWS_AUTHORIZATION,
    AWS_BASE_URL,
} from "../constants/config";

export async function getApod(date: string) {
  // Try getting the APOD first from the backend to see if we have it cached there from a previous fetch. If not, then fetch from the NASA API.
  let apodResponse = await fetch(
    AWS_BASE_URL + `${AWS_APODS_ENDPOINT}` + `/${date}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${AWS_AUTHORIZATION}`,
      },
    },
  );

  return apodResponse;
}

export async function postApod(
  data: any,
  date: string,
  title: any,
  image_url: any,
  explanation: any,
) {
  // Cache the APOD on the backend.
  const postApodResponse = await fetch(AWS_BASE_URL + `${AWS_APODS_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${AWS_AUTHORIZATION}`,
    },
    body: JSON.stringify({
      date,
      title,
      image_url,
      explanation,
    }),
  });

  return postApodResponse;
}

export async function fetchApodsFromBackendOrNasa(date: string) {
  let data = null;
  let apodWasFetchedFromBackend = false; // Flag to track if we successfully fetched the APOD from the backend cache.

  // Try getting the APOD first from the backend to see if we have it cached there from a previous fetch. If not, then fetch from the NASA API.
  let apodResponse = await getApod(date);

  if (!apodResponse.ok) {
    console.log("APOD not found in backend cache, fetching from NASA API.");
    // Get the APOD based on the date passed as a parameter in the URL. If no date is passed, default to today's APOD.
    apodResponse = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`,
    );
  } else {
    apodWasFetchedFromBackend = true;
  }

  // Should retrieve the APOD in JSON.
  data = await apodResponse.json();

  // If we successfully fetched the APOD from the NASA API (i.e., it wasn't cached on the backend),
  // then cache it on the backend for future use.
  if (!apodWasFetchedFromBackend) {
    let { title, url, explanation } = data;
    let image_url = url; // Rename url to image_url for clarity when caching on the backend.
    data["image_url"] = url; // Add image_url field to the data object for caching on the backend.
    const postApodResponse = await postApod(
      data,
      date,
      title,
      image_url,
      explanation,
    );

    // Retrieve the APOD again from the backend to get the id added by the backend,
    // and to ensure consistency in the data structure we are using throughout the app.
    if (!postApodResponse.ok) {
      console.log("Error caching APOD on backend.");
    } else {
      // Add the id from the backend to the data object so we can use it for favoriting and other operations that require the APOD id.
      const temp = await postApodResponse.json();
      data["id"] = temp.id;
      data["title"] = title;
      data["explanation"] = explanation;
      data["image_url"] = image_url;
    }
  } else {
    data = data.message[0];
    const dateOnly = data.date.slice(0, 10);
    data.date = dateOnly; // Format the date to only include the date portion (YYYY-MM-DD) for consistency and display purposes.
  }
  return data;
}
