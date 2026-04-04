import GalleryStyles from "@/app/Gallery.styles";
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
        <View style={GalleryStyles.viewImageFull}>
          <Image style={GalleryStyles.imageFull} source={{ uri: apod?.url }} />
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
