import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Button, View } from "react-native";
import { createCurrentDate } from "../utils/DateFormatting";

// This component is for the UI of picking the date to go to.

const DATE_OF_OLDEST_APOD = "1995-06-16"; // I believe this is the date of the oldest APOD.

interface DatePickerProps {
  showDatePicker: boolean;
  datePicked: Date;
  setShowDatePicker: () => void;
  onDatePicked: (event: DateTimePickerEvent, date: Date | undefined) => void;
}

export const DatePicker = ({
  showDatePicker,
  datePicked,
  setShowDatePicker,
  onDatePicked,
}: DatePickerProps) => {
  return (
    <View>
      <Button title="Select a Date" onPress={setShowDatePicker} />

      {showDatePicker && (
        <DateTimePicker
          value={datePicked} // Update the value with the date that was actually picked.
          mode="date"
          display="default"
          onChange={onDatePicked}
          minimumDate={new Date(DATE_OF_OLDEST_APOD)} // Prevent selecting prior to oldest APOD date
          maximumDate={createCurrentDate()} // Prevent selecting future dates
        />
      )}
    </View>
  );
};
