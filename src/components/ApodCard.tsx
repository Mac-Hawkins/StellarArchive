import GalleryStyles from "@/app/Gallery.styles";
import { Image, Text, TouchableWithoutFeedback, View } from "react-native";
import Toast from "react-native-toast-message";
import { Apod } from "../types/interfaces/Apod";

interface ApodCardProps {
  apod: Apod | undefined;
  onOpen: () => void;
  onLoadEnd: () => void;
}

// Component to represent the actual APOD card that can be swiped.
// This would include the title of the image, the image itself,
// and the image date.
export const ApodCard = ({ apod, onOpen, onLoadEnd }: ApodCardProps) => {
  return (
    <View style={GalleryStyles.containerApodView}>
      {/* The title of the APOD image */}
      <View style={{ alignItems: "center", marginTop: 20 }}>
        <Text style={GalleryStyles.textApodTitle}>{apod?.title}</Text>
        <Text style={GalleryStyles.textDate}>{apod?.date}</Text>
      </View>

      {/* APOD image (centered) */}
      <View style={GalleryStyles.containerImgView}>
        <TouchableWithoutFeedback onPress={onOpen}>
          <Image
            style={GalleryStyles.imageApodNormal}
            source={{ uri: apod?.image_url }}
            onLoadEnd={onLoadEnd}
          />
        </TouchableWithoutFeedback>
      </View>

      <Toast />
    </View>
  );
};
