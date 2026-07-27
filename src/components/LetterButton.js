// Displays one tappable letter in the grid on MengenalSemuaHurufScreen.
// It receives a letter item, whether that item is selected, and an onPress
// callback from its parent, then renders the letter with selected styling.
import { Pressable, StyleSheet, Text } from "react-native";

// Props are values supplied by the parent component. This component uses them
// to decide what to show and report a tap back to MengenalSemuaHurufScreen.
export default function LetterButton({ item, isSelected, onPress }) {
  // Pressable is React Native's tappable container. Calling the callback with
  // item lets the parent decide how the selected-letter state should change.
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={[styles.button, isSelected && styles.selectedButton]}
    >
      <Text style={[styles.letter, isSelected && styles.selectedLetter]}>
        {item.letter}
      </Text>
    </Pressable>
  );
}

// StyleSheet groups reusable React Native styles and validates their property
// names. The selected styles are added conditionally when isSelected is true.
const styles = StyleSheet.create({
  button: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
    elevation: 3,
  },
  selectedButton: {
    backgroundColor: "#16a34a",
  },
  letter: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1f2937",
  },
  selectedLetter: {
    color: "#ffffff",
  },
});
