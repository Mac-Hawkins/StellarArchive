import { styles } from "@/app/index.styles";
import { Image, Modal, TouchableWithoutFeedback, View } from "react-native";
import { Apod } from "../types/interfaces/Apod";

// Component to display the APOD image in full screen modal when the user taps on it.

interface ApodFullScreenModalProps {
  apod: Apod | undefined;
  isFullScreen: boolean;
  onClose: () => void;
}

export const ApodFullScreenModal = ({
  apod,
  isFullScreen,
  onClose,
}: ApodFullScreenModalProps) => {
  return (
    <Modal visible={isFullScreen} statusBarTranslucent={true}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.viewImageFull}>
          <Image style={styles.imageFull} source={{ uri: apod?.url }} />
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
