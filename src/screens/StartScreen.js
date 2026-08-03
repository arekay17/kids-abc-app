import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ModuleCard from "../components/ModuleCard";
import { MODULES } from "../data/modules";

const POINTING_MASCOT = require("../../assets/mascot/kak-limau-pointing.png");

// This is display-only placeholder progress until saved learning progress is
// introduced in a future task.
const FEATURED_PLACEHOLDER_PROGRESS = 0.35;

const PALETTE = {
  background: "#fff9e8",
  ink: "#294524",
  mutedInk: "#66705b",
  bubbleBorder: "#a8c93a",
  abc: { accent: "#f59e0b", soft: "#fff1bd", icon: "🔤" },
  vowels: { accent: "#38bdf8", soft: "#dff5ff", icon: "A E I O U" },
  syllables: { accent: "#9b87f5", soft: "#eee9ff", icon: "BA / BI" },
  words: { accent: "#2dc9b1", soft: "#dffaf5", icon: "📖" },
  practice: { accent: "#fb7185", soft: "#ffe5e9", icon: "⭐" },
};

function SpeechBubble({ compact }) {
  return (
    <View style={[styles.speechBubble, compact && styles.compactSpeechBubble]}>
      <Text style={[styles.speechText, compact && styles.compactSpeechText]}>
        Nak belajar apa hari ini?
      </Text>
      <View style={styles.speechTail} />
    </View>
  );
}

export default function StartScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 900 || height < 440;
  const guideWidth = Math.min(width * (isCompact ? 0.24 : 0.26), 320);
  const mascotHeight = Math.max(
    190,
    Math.min(height - (isCompact ? 96 : 132), guideWidth * 1.5, 480),
  );
  const featuredModule = MODULES.find((module) => module.id === "abc");
  const upcomingModules = MODULES.filter((module) => module.id !== "abc");

  function handleOpenModule(module) {
    if (module.id === "abc") {
      navigation.navigate("AbcMenu");
      return;
    }

    Alert.alert("Akan datang", `${module.title} akan dibuka nanti.`);
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={styles.safeArea}
    >
      <View style={[styles.layout, isCompact && styles.compactLayout]}>
        <View style={[styles.guideArea, { width: guideWidth }]}>
          <SpeechBubble compact={isCompact} />
          <Image
            accessibilityLabel="Kak Limau menunjuk ke arah pilihan modul"
            resizeMode="contain"
            source={POINTING_MASCOT}
            style={{ height: mascotHeight, width: mascotHeight * (2 / 3) }}
          />
        </View>

        <View style={styles.moduleArea}>
          <View style={[styles.heading, isCompact && styles.compactHeading]}>
            <Text style={[styles.appTitle, isCompact && styles.compactAppTitle]}>
              Belajar Bahasa Melayu
            </Text>
            <Text style={styles.subtitle}>Pilih modul pembelajaran</Text>
          </View>

          <ScrollView
            bounces={false}
            contentContainerStyle={[
              styles.moduleContent,
              isCompact && styles.compactModuleContent,
            ]}
            showsVerticalScrollIndicator={false}
            style={styles.moduleScroll}
          >
            <ModuleCard
              module={featuredModule}
              onPress={handleOpenModule}
              featured
              compact={isCompact}
              accentColor={PALETTE.abc.accent}
              softColor={PALETTE.abc.soft}
              icon={PALETTE.abc.icon}
              progress={FEATURED_PLACEHOLDER_PROGRESS}
              progressLabel="Teruskan belajar"
            />

            <View style={styles.upcomingGrid}>
              {upcomingModules.map((module) => {
                const presentation = PALETTE[module.id];

                return (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onPress={handleOpenModule}
                    locked
                    compact={isCompact}
                    accentColor={presentation.accent}
                    softColor={presentation.soft}
                    icon={presentation.icon}
                    style={styles.upcomingCard}
                  />
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  layout: {
    flex: 1,
    flexDirection: "row",
    gap: 22,
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  compactLayout: {
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  guideArea: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  speechBubble: {
    zIndex: 2,
    width: "94%",
    maxWidth: 270,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: PALETTE.bubbleBorder,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
    elevation: 3,
  },
  compactSpeechBubble: {
    borderRadius: 17,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  speechText: {
    color: PALETTE.ink,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
    textAlign: "center",
  },
  compactSpeechText: {
    fontSize: 15,
    lineHeight: 19,
  },
  speechTail: {
    position: "absolute",
    bottom: -8,
    right: "20%",
    width: 15,
    height: 15,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: PALETTE.bubbleBorder,
    backgroundColor: "#ffffff",
    transform: [{ rotate: "45deg" }],
  },
  moduleArea: {
    flex: 1,
    minWidth: 0,
  },
  heading: {
    marginBottom: 13,
  },
  compactHeading: {
    marginBottom: 8,
  },
  appTitle: {
    color: PALETTE.ink,
    fontSize: 33,
    fontWeight: "900",
    lineHeight: 39,
  },
  compactAppTitle: {
    fontSize: 26,
    lineHeight: 31,
  },
  subtitle: {
    color: PALETTE.mutedInk,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  moduleContent: {
    paddingBottom: 12,
  },
  moduleScroll: {
    flex: 1,
  },
  compactModuleContent: {
    paddingBottom: 8,
  },
  upcomingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  upcomingCard: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 190,
  },
});
