import { styles } from "@/app/index.styles";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Text, View } from "react-native";
import { Apod } from "../types/interfaces/Apod";
//import { ArrowUpFromLine } from 'lucide-react';

// This component is for displaing the explanation of the APOD as a bottom sheet that can be dragged
// up from the bottom of the screen.

interface ExplanationBottomSheetProps {
  apod: Apod | undefined;
  bottomSheetRef: any;
  onCloseSheet: () => void;
}

export const ExplanationBottomSheet = ({
  apod,
  bottomSheetRef,
  onCloseSheet,
}: ExplanationBottomSheetProps) => {
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enablePanDownToClose={true} // Allows swiping away the bottom sheet by swiping down.
      snapPoints={["25%", "80%"]}
      onClose={onCloseSheet}
    >
      {/* When the bottom sheet is closed, call the closeSheet function to update the state in ApodStore.*/}
      <BottomSheetScrollView>
        {/* Header */}
        <View>
          <Text style={styles.textExplanationTitle}>Explanation</Text>

          {/* Display the explanation of the APOD, which is passed as a parameter. */}
          <Text style={styles.textExplanation}>{apod?.explanation}</Text>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};
