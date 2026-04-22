import GalleryStyles from "@/app/Gallery.styles";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Text, TouchableOpacity, View } from "react-native";
import { Apod } from "../types/interfaces/Apod";
//import { ArrowUpFromLine } from 'lucide-react';

// This component is for displaing the explanation of the APOD as a bottom sheet that can be dragged
// up from the bottom of the screen.

interface ExplanationBottomSheetProps {
  apod: Apod | undefined;
  bottomSheetRef: any;
  onCloseSheet: () => void;
  onPressComment: (item: {
    id: number;
    message: string;
    user_id: number;
    created_at: string;
  }) => void;
  apodComments: any;
}

export const ExplanationBottomSheet = ({
  apod,
  bottomSheetRef,
  onCloseSheet,
  onPressComment,
  apodComments,
}: ExplanationBottomSheetProps) => {
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enablePanDownToClose={true} // Allows swiping away the bottom sheet by swiping down.
      snapPoints={["25%", "80%"]}
      onClose={onCloseSheet}
      style={{ backgroundColor: "black" }}
    >
      <BottomSheetFlatList
        style={{ padding: 20, backgroundColor: "black" }}
        data={
          apodComments?.message && Array.isArray(apodComments.message)
            ? apodComments.message.map((comment: any) => ({
                id: comment.id,
                message: comment.message,
                user_id: comment.user_id,
                username: comment.username,
                created_at: comment.created_at,
              }))
            : []
        }
        ListHeaderComponent={
          <View>
            <Text style={GalleryStyles.textExplanationTitle}>Explanation</Text>

            {/* Display the explanation of the APOD, which is passed as a parameter. */}
            <Text style={GalleryStyles.textExplanation}>
              {apod?.explanation}
            </Text>

            <Text style={GalleryStyles.textExplanationTitle}>Comments</Text>
          </View>
        }
        keyExtractor={(item: { id: any }) => item.id.toString()}
        renderItem={({
          item,
        }: {
          item: {
            id: number;
            message: string;
            user_id: number;
            username: string;
            created_at: string;
          };
        }) => (
          <TouchableOpacity onPress={() => onPressComment(item)}>
            <Text
              style={{
                fontSize: 18,
                color: "white",
                textAlign: "justify",
              }}
            >
              {item.username + ": " + item.message}
            </Text>
            <Text style={{ fontSize: 12, color: "white", marginBottom: 100 }}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
      />
    </BottomSheet>
  );
};
