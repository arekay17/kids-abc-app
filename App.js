import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import StartScreen from "./src/screens/StartScreen";
import AbcActivitiesScreen from "./src/screens/AbcActivitiesScreen";
import MengenalSemuaHurufScreen from "./src/activities/abc/MengenalSemuaHurufScreen";
import CariHurufScreen from "./src/activities/abc/CariHurufScreen";
import HurufPertamaScreen from "./src/activities/abc/HurufPertamaScreen";
import { LETTERS } from "./src/data/letters";

export default function App() {
  // This state acts as a small navigation system. Changing its value makes
  // React render the matching screen below without needing a navigation library.
  const [screen, setScreen] = useState("start");
  const [selectedLetter, setSelectedLetter] = useState(LETTERS[0]);

  // StartScreen passes the chosen module here. The ABC module now opens its
  // activity menu first; modules that are not ready still show a message.
  function handleOpenModule(module) {
    if (module.id === "abc") {
      setScreen("abcActivities");
      return;
    }

    Alert.alert("Akan datang", `${module.title} akan dibuka nanti.`);
  }

  // These callback handlers describe each allowed screen transition. Child
  // screens receive them as props and call them when a button is pressed.
  function handleOpenAlphabet() {
    setScreen("mengenalSemuaHuruf");
  }

  function handleOpenCariHuruf() {
    setScreen("cariHuruf");
  }

  function handleOpenHurufPertama() {
    setScreen("hurufPertama");
  }

  function handleBackToStart() {
    setScreen("start");
  }

  function handleBackToAbcActivities() {
    setScreen("abcActivities");
  }

  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Conditional rendering displays one screen for the current state.
            The nested condition keeps the app's simple state-based navigation. */}
        {screen === "start" ? (
          <StartScreen onOpenModule={handleOpenModule} />
        ) : screen === "abcActivities" ? (
          <AbcActivitiesScreen
            onOpenAlphabet={handleOpenAlphabet}
            onOpenCariHuruf={handleOpenCariHuruf}
            onOpenHurufPertama={handleOpenHurufPertama}
            onBack={handleBackToStart}
          />
        ) : screen === "cariHuruf" ? (
          <CariHurufScreen onBack={handleBackToAbcActivities} />
        ) : screen === "hurufPertama" ? (
          <HurufPertamaScreen onBack={handleBackToAbcActivities} />
        ) : (
          <MengenalSemuaHurufScreen
            selectedLetter={selectedLetter}
            onSelectLetter={setSelectedLetter}
            onBack={handleBackToAbcActivities}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
