import { AWS_APODS_ENDPOINT, AWS_BASE_URL } from "../constants/config";

// String constants
const DATA_SUBFIELD = "message";

// Int constants
const NOT_FOUND_ERROR_CODE = 404;
const SERVER_ERROR_CODE = 500;
const DATE_STRING_START_INDEX = 0;
const DATE_STRING_END_INDEX = 10;

function logApodRetrievalError(apodResponse: Response, date: string) {
  if (apodResponse.status === NOT_FOUND_ERROR_CODE) {
    console.error(`APOD for date ${date} not found.`);
  } else if (apodResponse.status === SERVER_ERROR_CODE) {
    console.error(`Server error while fetching APOD for date ${date}.`);
  } else {
    console.error(
      `Unexpected error while fetching APOD for date ${date}: ${apodResponse.statusText}`,
    );
  }
}

/*
Attempts to retrieve the APOD from the backend.
@param date - a string date formatted as (YYYY-MM-DD) to retrieve the APOD from.
@returns The APOD JSON data if available, else null.
*/
export async function fetchApod(date: string) {
  let data = null;
  try {
    let apodResponse = await fetch(
      `${AWS_BASE_URL}${AWS_APODS_ENDPOINT}/${date}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    // If the response is not successful, log an error message and return null.
    if (!apodResponse.ok) {
      logApodRetrievalError(apodResponse, date);
      return null;
    }

    // If we made it this far then the response was successful, so parse the JSON data.
    data = await apodResponse.json();

    // If the data is available, format the date to only include the date portion (YYYY-MM-DD) for consistency and display purposes.
    if (data != null && DATA_SUBFIELD in data) {
      data = data[DATA_SUBFIELD];
      const dateOnly = data.date.slice(
        DATE_STRING_START_INDEX,
        DATE_STRING_END_INDEX,
      );
      data.date = dateOnly;
    }
  } catch (error) {
    console.error("Error fetching APOD from backend: ", error);
  }

  return data;
}
