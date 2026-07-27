import { Pressable, StyleSheet, Text } from "react-native";

export default function LetterButton({ item, isSelected, onPress }) {
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