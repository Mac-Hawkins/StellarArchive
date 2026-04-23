import GalleryStyles from "@/app/Gallery.styles";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
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
  onPressPostComment: (comment: string) => void;
  apodComments: any;
  isUserLoggedIn: boolean;
}

export const ExplanationBottomSheet = ({
  apod,
  bottomSheetRef,
  onCloseSheet,
  onPressComment,
  onPressPostComment,
  apodComments,
  isUserLoggedIn,
}: ExplanationBottomSheetProps) => {
  const [text, setText] = useState("");

  const onPressSend = (comment: string) => {
    Keyboard.dismiss(); // Dismiss the keyboard after pressing send. This way toast will show.
    onPressPostComment(comment); // Call the function passed from UserHome to post the comment to the backend.
    setText(""); // Clear the text input after posting the comment.
  };

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
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity onPress={() => onPressComment(item)}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <FontAwesome name="user" size={24} color="white" />

                <Text
                  style={{
                    fontSize: 18,
                    color: "white",
                    textAlign: "justify",
                  }}
                >
                  {item.username + ": " + item.message}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: "white", marginBottom: 100 }}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 50}
        style={{ backgroundColor: "black" }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 10,
            backgroundColor: "black",
            paddingBottom: 75,
            gap: 10,
          }}
        >
          <TextInput
            style={{
              backgroundColor: "gray",
              color: "white",
              padding: 10,
              borderRadius: 5,
              flex: 1,
            }}
            placeholder={
              isUserLoggedIn
                ? "Add a comment..."
                : "Please log in to add a comment."
            }
            placeholderTextColor="lightgray"
            submitBehavior="newline"
            multiline={true}
            value={text}
            onChangeText={setText}
            editable={isUserLoggedIn}
          />
          <Pressable
            disabled={!text.trim() || !isUserLoggedIn}
            onPress={() => onPressSend(text)}
            style={{
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <AntDesign
              name="send"
              size={32}
              color={isUserLoggedIn ? "white" : "lightgray"}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};
