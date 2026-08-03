import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import StartScreen from "./src/screens/StartScreen";
import AbcActivitiesScreen from "./src/screens/AbcActivitiesScreen";
import MengenalSemuaHurufScreen from "./src/activities/abc/MengenalSemuaHurufScreen";
import CariHurufScreen from "./src/activities/abc/CariHurufScreen";
import HurufPertamaScreen from "./src/activities/abc/HurufPertamaScreen";
import PadankanHurufScreen from "./src/activities/abc/PadankanHurufScreen";
import { LETTERS } from "./src/data/letters";

const Stack = createNativeStackNavigator();

export default function App() {
  // Keep the selected letter outside the navigator so it remains selected if
  // the learner leaves this activity and opens it again later.
  const [selectedLetter, setSelectedLetter] = useState(LETTERS[0]);

  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      {/* NavigationContainer owns route history and connects the native stack
          to Android and iOS back behaviour. Only one is needed for this app. */}
      <NavigationContainer>
        {/* Registering every destination in one stack preserves the simple
            Welcome → Home → ABC menu → activity hierarchy. */}
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: true,
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Home" component={StartScreen} />
          <Stack.Screen name="AbcMenu" component={AbcActivitiesScreen} />
          <Stack.Screen name="CariHuruf" component={CariHurufScreen} />
          <Stack.Screen name="HurufPertama" component={HurufPertamaScreen} />
          <Stack.Screen name="PadankanHuruf" component={PadankanHurufScreen} />
          <Stack.Screen name="MengenalSemuaHuruf">
            {(navigationProps) => (
              <MengenalSemuaHurufScreen
                {...navigationProps}
                selectedLetter={selectedLetter}
                onSelectLetter={setSelectedLetter}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
