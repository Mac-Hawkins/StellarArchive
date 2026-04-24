import GalleryStyles from "@/app/Gallery.styles";
import { AntDesign, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { Apod } from "../types/interfaces/Apod";

// This component is for displaing the explanation of the APOD as a bottom sheet that can be dragged
// up from the bottom of the screen.

interface ExplanationBottomSheetProps {
  apod: Apod | undefined;
  bottomSheetRef: any;
  onCloseSheet: () => void;
  onPressPostComment: (comment: string, parentCommentId: number | null) => void;
  apodComments: any;
  isUserLoggedIn: boolean;
}

export const ExplanationBottomSheet = ({
  apod,
  bottomSheetRef,
  onCloseSheet,
  onPressPostComment,
  apodComments,
  isUserLoggedIn,
}: ExplanationBottomSheetProps) => {
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    parentCommentId: number;
    username: string;
  } | null>(null);

  const onPressSend = (comment: string, parentCommentId: number | null) => {
    Keyboard.dismiss(); // Dismiss the keyboard after pressing send. This way toast will show.
    onPressPostComment(comment, parentCommentId); // Call the function passed from UserHome to post the comment to the backend.
    setText(""); // Clear the text input after posting the comment.
    setReplyingTo(null); // Clear the replying state after sending
  };

  const onPressReply = (parentCommentId: number, username: string) => {
    setReplyingTo({ parentCommentId, username });
    inputRef.current?.focus(); // Focus the text input when pressing reply.
  };

  // Sort comments so that replies appear directly after their parent comment
  const sortedComments = (comments: any[]) => {
    const parentComments = comments.filter((c) => !c.parent_comment_id);
    const replies = comments.filter((c) => c.parent_comment_id);

    const sorted: any[] = [];

    parentComments.forEach((parent) => {
      sorted.push(parent);
      const parentReplies = replies.filter(
        (reply) => reply.parent_comment_id === parent.id,
      );
      sorted.push(...parentReplies);
    });

    return sorted;
  };

  // When replying to a comment, pre-fill the text input with the username of the comment
  // being replied to and focus the input.
  useEffect(() => {
    if (replyingTo) {
      const username = replyingTo.username;
      const mention = `@${username} `;

      setText(mention);

      // Wait for the input to update, then focus
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [replyingTo]);

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
          // Map the comments from the backend to the format needed for rendering. If there are no comments, pass an empty array.
          apodComments?.message && Array.isArray(apodComments.message)
            ? sortedComments(
                apodComments.message.map((comment: any) => ({
                  id: comment.id,
                  parent_comment_id: comment.parent_comment_id,
                  message: comment.message,
                  user_id: comment.user_id,
                  username: comment.username,
                  created_at: comment.created_at,
                  isReply: !!comment.parent_comment_id, // Add an isReply field to easily identify if the comment is a reply or a top-level comment.
                })),
              )
            : []
        }
        // The header of the list will display the explanation of the APOD, and then the comments will be listed below.
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
            parent_comment_id: number | null;
            message: string;
            user_id: number;
            username: string;
            created_at: string;
            isReply: boolean;
          };
        }) => (
          // The comments section
          <View style={{ marginBottom: 20 }}>
            {item.isReply && (
              <View
                style={{
                  width: 2,
                  backgroundColor: "gray",
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 14, // Position the line to the left of the comment content, leaving space for the user icon.
                }}
              />
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginLeft: item.isReply ? 28 : 0,
                marginTop: item.isReply ? 0 : 30,
              }} // Indent replies to visually distinguish them from top-level comments.
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
              <Pressable
                onPress={() => onPressReply(item.id, item.username)}
                style={{ marginLeft: "auto" }}
                disabled={!isUserLoggedIn}
              >
                <FontAwesome5
                  name="reply"
                  size={24}
                  color={isUserLoggedIn ? "white" : "lightgray"}
                />
              </Pressable>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: "white",
                marginBottom: 10,
                marginLeft: item.isReply ? 56 : 28,
              }}
            >
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        )}
      />
      {/* The send comment section */}
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
            ref={inputRef}
            placeholderTextColor="lightgray"
            submitBehavior="newline"
            multiline={true}
            value={text}
            onChangeText={setText}
            editable={isUserLoggedIn}
          />
          <Pressable
            disabled={!text.trim() || !isUserLoggedIn}
            onPress={() =>
              onPressSend(text, replyingTo?.parentCommentId || null)
            }
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
