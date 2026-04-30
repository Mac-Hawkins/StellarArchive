export const handler = async (event) => {
  // Gets the APOD from NASA.
  let apodData = null;
  try {
    if ("apodDate" in event) {
      const apodDate = event.apodDate;

      const nasaResponse = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}&date=${apodDate}`,
      );

      if (nasaResponse) {
        apodData = await nasaResponse.json();
      }
    }
  } catch (error) {
    console.log("Error retrieving APOD from NASA.", error);
  }

  return apodData;
};
