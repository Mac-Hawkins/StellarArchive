// File to hold utility methods for date processing.

// Create today's date, but normalized to make it beginning of today.
export const createCurrentDate = (): Date => {
  let date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

// Take in a date object and convert it to a string as "YYYY-MM-DD"
export const formatDateToStr = (date: Date): string => {
  date.setHours(0, 0, 0, 0); // Normalize the selected date to midnight to avoid timezone issues.
  let dateStr: string = date.toISOString().split("T")[0];
  return dateStr;
};

// Take in a date string and add 1 day to it, returning it as a string.
export const incrementDate = (date: string): string => {
  let nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  date = nextDay.toISOString().split("T")[0];
  return date;
};

// Take in a date string and subtract 1 day from it, returning it as a string.
export const decrementDate = (date: string): string => {
  let prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);
  date = prevDay.toISOString().split("T")[0];
  return date;
};
