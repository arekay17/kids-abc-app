import { useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ModuleCard from "../components/ModuleCard";
import { MODULES } from "../data/modules";
import useModuleScreenAudio from "../hooks/useModuleScreenAudio";

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

function SpeechBubble({ compact, style }) {
  return (
    <Animated.View
      style={[
        styles.speechBubble,
        compact && styles.compactSpeechBubble,
        style,
      ]}
    >
      <Text style={[styles.speechText, compact && styles.compactSpeechText]}>
        Nak belajar apa hari ini?
      </Text>
      <View style={styles.speechTail} />
    </Animated.View>
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
  const { isMusicEnabled, toggleMusic } = useModuleScreenAudio();

  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const mascotEntranceX = useRef(new Animated.Value(-14)).current;
  const mascotEntranceY = useRef(new Animated.Value(24)).current;
  const mascotEntranceScale = useRef(new Animated.Value(0.94)).current;
  const mascotPointX = useRef(new Animated.Value(0)).current;
  const mascotPointScale = useRef(new Animated.Value(1)).current;
  const mascotIdleY = useRef(new Animated.Value(0)).current;
  const mascotIdleScale = useRef(new Animated.Value(1)).current;
  const mascotIdleRotation = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleY = useRef(new Animated.Value(10)).current;
  const bubbleScale = useRef(new Animated.Value(0.96)).current;
  const entranceAnimation = useRef(null);
  const pointAnimation = useRef(null);
  const idleAnimation = useRef(null);
  const bubbleAnimation = useRef(null);
  const animationRun = useRef(0);

  const stopAndResetMascotAnimations = useCallback(() => {
    animationRun.current += 1;
    entranceAnimation.current?.stop();
    pointAnimation.current?.stop();
    idleAnimation.current?.stop();
    bubbleAnimation.current?.stop();

    mascotOpacity.setValue(0);
    mascotEntranceX.setValue(-14);
    mascotEntranceY.setValue(24);
    mascotEntranceScale.setValue(0.94);
    mascotPointX.setValue(0);
    mascotPointScale.setValue(1);
    mascotIdleY.setValue(0);
    mascotIdleScale.setValue(1);
    mascotIdleRotation.setValue(0);
    bubbleOpacity.setValue(0);
    bubbleY.setValue(10);
    bubbleScale.setValue(0.96);
  }, [
    bubbleOpacity,
    bubbleScale,
    bubbleY,
    mascotEntranceScale,
    mascotEntranceX,
    mascotEntranceY,
    mascotIdleRotation,
    mascotIdleScale,
    mascotIdleY,
    mascotOpacity,
    mascotPointScale,
    mascotPointX,
  ]);

  const startMascotAnimations = useCallback(() => {
    stopAndResetMascotAnimations();
    const runId = animationRun.current;

    bubbleAnimation.current = Animated.sequence([
      Animated.delay(190),
      Animated.parallel([
        Animated.timing(bubbleOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bubbleY, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bubbleScale, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    entranceAnimation.current = Animated.parallel([
      Animated.timing(mascotOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(mascotEntranceX, {
        toValue: 0,
        duration: 580,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(mascotEntranceY, {
        toValue: 0,
        duration: 580,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(mascotEntranceScale, {
        toValue: 1,
        duration: 580,
        easing: Easing.out(Easing.back(1.08)),
        useNativeDriver: true,
      }),
    ]);

    bubbleAnimation.current.start();
    entranceAnimation.current.start(({ finished }) => {
      if (!finished || animationRun.current !== runId) return;

      const pointTowardModules = () =>
        Animated.sequence([
          Animated.parallel([
            Animated.timing(mascotPointX, {
              toValue: 6,
              duration: 170,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(mascotPointScale, {
              toValue: 1.015,
              duration: 170,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(mascotPointX, {
              toValue: 0,
              duration: 170,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(mascotPointScale, {
              toValue: 1,
              duration: 170,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ]);

      pointAnimation.current = Animated.sequence([
        pointTowardModules(),
        pointTowardModules(),
      ]);

      pointAnimation.current.start(({ finished: pointFinished }) => {
        if (!pointFinished || animationRun.current !== runId) return;

        idleAnimation.current = Animated.loop(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(mascotIdleY, {
                toValue: -5,
                duration: 1300,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(mascotIdleY, {
                toValue: 0,
                duration: 1300,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(mascotIdleScale, {
                toValue: 1.01,
                duration: 1300,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(mascotIdleScale, {
                toValue: 1,
                duration: 1300,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(mascotIdleRotation, {
                toValue: 1,
                duration: 1300,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(mascotIdleRotation, {
                toValue: 0,
                duration: 1300,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
          ]),
        );
        idleAnimation.current.start();
      });
    });
  }, [
    bubbleOpacity,
    bubbleScale,
    bubbleY,
    mascotEntranceScale,
    mascotEntranceX,
    mascotEntranceY,
    mascotIdleRotation,
    mascotIdleScale,
    mascotIdleY,
    mascotOpacity,
    mascotPointScale,
    mascotPointX,
    stopAndResetMascotAnimations,
  ]);

  useFocusEffect(
    useCallback(() => {
      startMascotAnimations();

      return stopAndResetMascotAnimations;
    }, [startMascotAnimations, stopAndResetMascotAnimations]),
  );

  const mascotRotation = mascotIdleRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "0.6deg"],
  });

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
          <View style={styles.speechAnimationContainer}>
            <SpeechBubble
              compact={isCompact}
              style={{
                opacity: bubbleOpacity,
                transform: [
                  { translateY: bubbleY },
                  { scale: bubbleScale },
                ],
              }}
            />
          </View>
          <Animated.View
            style={{
              height: mascotHeight,
              width: mascotHeight * (2 / 3),
              opacity: mascotOpacity,
              transform: [
                { translateX: mascotEntranceX },
                { translateY: mascotEntranceY },
                { scale: mascotEntranceScale },
                { translateX: mascotPointX },
                { scale: mascotPointScale },
                { translateY: mascotIdleY },
                { scale: mascotIdleScale },
                { rotate: mascotRotation },
              ],
            }}
          >
            <Image
              accessibilityLabel="Kak Limau menunjuk ke arah pilihan modul"
              resizeMode="contain"
              source={POINTING_MASCOT}
              style={styles.mascotImage}
            />
          </Animated.View>
        </View>

        <View style={styles.moduleArea}>
          <View style={styles.headingRow}>
            <View style={[styles.heading, isCompact && styles.compactHeading]}>
              <Text
                style={[styles.appTitle, isCompact && styles.compactAppTitle]}
              >
                Belajar Bahasa Melayu
              </Text>
              <Text style={styles.subtitle}>Pilih modul pembelajaran</Text>
            </View>
            <Pressable
              accessibilityLabel={
                isMusicEnabled ? "Matikan muzik" : "Hidupkan muzik"
              }
              accessibilityRole="button"
              hitSlop={6}
              onPress={toggleMusic}
              style={({ pressed }) => [
                styles.soundButton,
                pressed && styles.soundButtonPressed,
              ]}
            >
              <Text style={styles.soundButtonText}>
                {isMusicEnabled ? "🔊" : "🔇"}
              </Text>
            </Pressable>
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
  speechAnimationContainer: {
    width: "100%",
    alignItems: "center",
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
  mascotImage: {
    width: "100%",
    height: "100%",
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  heading: {
    flex: 1,
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
  soundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: PALETTE.bubbleBorder,
    elevation: 3,
  },
  soundButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  soundButtonText: {
    fontSize: 22,
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
