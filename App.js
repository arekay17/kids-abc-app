import { useState } from "react";
import { Alert, SafeAreaView, StyleSheet } from "react-native";
import StartScreen from "./src/screens/StartScreen";
import AlphabetScreen from "./src/screens/AlphabetScreen";
import { LETTERS } from "./src/data/letters";

export default function App() {
  const [screen, setScreen] = useState("start");
  const [selectedLetter, setSelectedLetter] = useState(LETTERS[0]);

  function handleOpenModule(module) {
    if (module.id === "abc") {
      setScreen("abc");
      return;
    }

    Alert.alert("Akan datang", `${module.title} akan dibuka nanti.`);
  }

  function handleBackToStart() {
    setScreen("start");
  }

  return (
    <SafeAreaView style={styles.container}>
      {screen === "start" ? (
        <StartScreen onOpenModule={handleOpenModule} />
      ) : (
        <AlphabetScreen
          selectedLetter={selectedLetter}
          onSelectLetter={setSelectedLetter}
          onBack={handleBackToStart}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});