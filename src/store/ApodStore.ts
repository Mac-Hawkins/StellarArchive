import { create } from "zustand";
import { SwipeDirection } from "../types/enums/SwipeDirection";
import { Apod } from "../types/interfaces/Apod";

export interface ApodStore {
  pastQueries: Record<string, Apod>;
  isSheetOpen: boolean;
  currentDate: string;
  swipeDirection: SwipeDirection | null;
  setApodDate: (date: string, direction: SwipeDirection | null) => void;
  openSheet: () => void;
  closeSheet: () => void;
  cacheApodData: (date: string, data: Apod) => void;
}

// Create a Zustand store to manage the state of the APOD data and the bottom sheet.
// I need this as a way to allow the bottomSheet to be re-opened after it has been closed, without having to refresh the page or navigate away and back.
export const useApodStore = create<ApodStore>((set) => ({
  // Dictionary to store past APOD queries, with the date as the key and the APOD data as the value.
  // This allows us to cache previously fetched APODs and avoid unnecessary API calls when the user swipes back to a previously viewed date.
  pastQueries: {},
  // The state of the BottomSheet.
  isSheetOpen: false,
  currentDate: "",
  swipeDirection: null,

  // Function to set the current APOD date and swipe direction for a given date.
  setApodDate: (date: string, direction: SwipeDirection) =>
    set({ currentDate: date, swipeDirection: direction }),

  // The actions (functions to change the state of the BottomSheet)
  openSheet: () => set({ isSheetOpen: true }),
  closeSheet: () => set({ isSheetOpen: false }),

  // Setter for the pastQueries to add APOD data.
  cacheApodData: (date: string, data: Apod) =>
    set((state: ApodStore) => ({
      pastQueries: {
        ...state.pastQueries,
        [date]: data,
      },
    })),
}));
