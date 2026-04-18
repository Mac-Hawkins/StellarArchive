// Interface to represent the Astronomy Picture of the Day (APOD) data structure returned by the NASA API.
export interface Apod {
  id: number;
  date: string;
  explanation: string;
  //media_type: string;
  //service_version: string;
  title: string;
  image_url: string;
}
