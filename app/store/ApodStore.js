import { create } from "zustand";

// Create a Zustand store to manage the state of the APOD data and the bottom sheet.
// I need this as a way to allow the bottomSheet to be re-opened after it has been closed, without having to refresh the page or navigate away and back.
export const useApodStore = create((set) => ({
  // The state
  isSheetOpen: false,

  // The actions (functions to change the state)
  openSheet: () => set({ isSheetOpen: true }),
  closeSheet: () => set({ isSheetOpen: false }),

  // Add a reset for when the user flings again
  resetSheet: () => set({ isSheetOpen: false }),
}));
