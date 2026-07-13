export const handler = async (event) => {
  // Gets the APOD from NASA.
  let apodData = null;
  try {
    if (!event.apodDate) {
      throw new Error("Invalid request: missing 'apodDate' parameter.");
    }

    const apodDate = event.apodDate;

    const nasaResponse = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}&date=${apodDate}`,
    );

    if (!nasaResponse.ok) {
      throw new Error(
        `Failed to retrieve APOD from NASA. Status: ${nasaResponse.status}`,
      );
    }

    apodData = await nasaResponse.json();
  } catch (error) {
    console.error("Error retrieving APOD from NASA.", error);
    // Re-throw for calling lambda to catch and handle the error appropriately.
    throw error;
  }

  return apodData;
};
