import { create } from "zustand";

// Create a Zustand store to manage the state of the APOD data and the bottom sheet.
// I need this as a way to allow the bottomSheet to be re-opened after it has been closed, without having to refresh the page or navigate away and back.
export const useApodStore = create((set) => ({
  // Dictionary to store past APOD queries, with the date as the key and the APOD data as the value.
  // This allows us to cache previously fetched APODs and avoid unnecessary API calls when the user swipes back to a previously viewed date.
  pastQueries: {},
  // The state of the BottomSheet.
  isSheetOpen: false,

  // The actions (functions to change the state)
  openSheet: () => set({ isSheetOpen: true }),
  closeSheet: () => set({ isSheetOpen: false }),
}));
