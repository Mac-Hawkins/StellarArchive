import { styles } from "@/app/index.styles";
import { Image, Text, TouchableWithoutFeedback, View } from "react-native";
import Toast from "react-native-toast-message";
import { Apod } from "../types/interfaces/Apod";

interface ApodCardProps {
  apod: Apod | undefined;
  onOpen: () => void;
}

// Component to represent the actual APOD card that can be swiped.
// This would include the title of the image, the image itself,
// and the image date.
export const ApodCard = ({ apod, onOpen }: ApodCardProps) => {
  return (
    <View style={styles.containerApodView}>
      {/* The title of the APOD image */}
      <View style={{ alignItems: "center", paddingTop: 30 }}>
        <Text style={styles.textApodTitle}>{apod?.title}</Text>
      </View>

      {/* APOD image (centered) */}
      <View style={styles.containerImgView}>
        <TouchableWithoutFeedback onPress={onOpen}>
          <Image style={styles.imageApodNormal} source={{ uri: apod?.url }} />
        </TouchableWithoutFeedback>
      </View>

      {/* The date of the APOD image */}
      <View style={{ alignItems: "center", paddingBottom: 40 }}>
        <Text style={styles.textDate}>{apod?.date}</Text>
      </View>
      <Toast />
    </View>
  );
};
