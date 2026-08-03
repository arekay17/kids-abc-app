import { useEffect, useRef } from "react";
import {
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

const MASCOT = require("../../assets/mascot/kak-limau-main.png");

export default function WelcomeScreen({ onStart }) {
  const { width, height } = useWindowDimensions();
  const isCompact = height < 430 || width < 750;
  const mascotHeight = Math.min(
    height * (isCompact ? 0.88 : 0.82),
    width * (isCompact ? 0.5 : 0.48),
    600,
  );

  const entranceOpacity = useRef(new Animated.Value(0)).current;
  const entranceY = useRef(new Animated.Value(32)).current;
  const idleY = useRef(new Animated.Value(0)).current;
  const entranceScale = useRef(new Animated.Value(0.9)).current;
  const idleScale = useRef(new Animated.Value(1)).current;
  const mascotRotation = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.94)).current;
  const entranceAnimation = useRef(null);
  const greetingAnimation = useRef(null);
  const idleAnimation = useRef(null);
  const buttonAnimation = useRef(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    // Phase one gives Kak Limau a clear but soft fade, rise, and scale entrance.
    entranceAnimation.current = Animated.parallel([
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(entranceY, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.back(1.15)),
        useNativeDriver: true,
      }),
      Animated.timing(entranceScale, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.back(1.15)),
        useNativeDriver: true,
      }),
    ]);

    // Keep the existing delayed Mula-button reveal independent of the mascot.
    buttonAnimation.current = Animated.sequence([
      Animated.delay(250),
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),
    ]);

    entranceAnimation.current.start(({ finished }) => {
      if (!finished) return;

      // Phase two tilts the whole mascot once to suggest a friendly wave.
      greetingAnimation.current = Animated.sequence([
        Animated.timing(mascotRotation, {
          toValue: -4,
          duration: 180,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(mascotRotation, {
          toValue: 4,
          duration: 260,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(mascotRotation, {
          toValue: -2,
          duration: 190,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(mascotRotation, {
          toValue: 0,
          duration: 160,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]);

      greetingAnimation.current.start(({ finished: greetingFinished }) => {
        if (!greetingFinished) return;

        // Phase three combines a slow float, tiny tilt, and breathing-like pulse.
        // It starts only after the greeting, so there can never be two loops.
        idleAnimation.current = Animated.loop(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(idleY, {
                toValue: -8,
                duration: 1100,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(idleY, {
                toValue: 0,
                duration: 1100,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(idleScale, {
                toValue: 1.025,
                duration: 1100,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(idleScale, {
                toValue: 1,
                duration: 1100,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(mascotRotation, {
                toValue: 1.2,
                duration: 550,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(mascotRotation, {
                toValue: 0,
                duration: 550,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(mascotRotation, {
                toValue: -1.2,
                duration: 550,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(mascotRotation, {
                toValue: 0,
                duration: 550,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
          ]),
        );
        idleAnimation.current.start();
      });
    });

    buttonAnimation.current.start();

    // Each phase has its own reference so unmounting or pressing Mula can stop
    // whichever phase is active without leaving native animations running.
    return () => {
      entranceAnimation.current?.stop();
      greetingAnimation.current?.stop();
      idleAnimation.current?.stop();
      buttonAnimation.current?.stop();
    };
  }, [
    buttonOpacity,
    buttonScale,
    entranceOpacity,
    entranceScale,
    entranceY,
    idleScale,
    idleY,
    mascotRotation,
  ]);

  function handleStart() {
    // Guard against rapid taps while App is switching to the start screen.
    if (hasStarted.current) return;

    hasStarted.current = true;
    entranceAnimation.current?.stop();
    greetingAnimation.current?.stop();
    idleAnimation.current?.stop();
    buttonAnimation.current?.stop();
    onStart();
  }

  const mascotRotate = mascotRotation.interpolate({
    inputRange: [-4, 4],
    outputRange: ["-4deg", "4deg"],
  });

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={styles.safeArea}
    >
      <View pointerEvents="none" style={styles.sunGlow} />
      <View pointerEvents="none" style={styles.orangeDot} />
      <View pointerEvents="none" style={styles.limeDot} />

      <View style={[styles.layout, isCompact && styles.compactLayout]}>
        <Animated.View
          style={[
            styles.mascotPanel,
            {
              opacity: entranceOpacity,
              transform: [{ translateY: entranceY }],
            },
          ]}
        >
          <Animated.View
            style={{
              transform: [
                { translateY: idleY },
                { scale: entranceScale },
                { scale: idleScale },
                { rotate: mascotRotate },
              ],
            }}
          >
            <Image
              accessibilityLabel="Kak Limau melambai"
              resizeMode="contain"
              source={MASCOT}
              style={{ height: mascotHeight, width: mascotHeight * (2 / 3) }}
            />
          </Animated.View>
        </Animated.View>

        <ScrollView
          bounces={false}
          contentContainerStyle={styles.contentScroll}
          showsVerticalScrollIndicator={false}
          style={styles.contentSide}
        >
          <View style={[styles.welcomeCard, isCompact && styles.compactCard]}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>LN</Text>
              </View>
              <Text style={styles.brandText}>Dibawakan oleh Limau Nipis</Text>
            </View>

            <Text style={[styles.title, isCompact && styles.compactTitle]}>
              Hai! Saya Kak Limau!
            </Text>
            <Text style={[styles.subtitle, isCompact && styles.compactSubtitle]}>
              Selamat datang. Jom belajar membaca bersama!
            </Text>

            <Animated.View
              style={{
                opacity: buttonOpacity,
                transform: [{ scale: buttonScale }],
              }}
            >
              <Pressable
                accessibilityHint="Membuka pilihan modul pembelajaran"
                accessibilityRole="button"
                onPress={handleStart}
                style={({ pressed }) => [
                  styles.startButton,
                  pressed && styles.startButtonPressed,
                ]}
              >
                <Text style={styles.startButtonText}>Mula</Text>
                <Text style={styles.startButtonArrow}>→</Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff9df",
    overflow: "hidden",
  },
  layout: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 18,
    gap: 24,
  },
  compactLayout: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 12,
  },
  mascotPanel: {
    flex: 0.9,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  contentSide: {
    flex: 1.1,
  },
  contentScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 4,
  },
  welcomeCard: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    backgroundColor: "#fffef5",
    borderColor: "#e4ef9d",
    borderWidth: 2,
    borderRadius: 32,
    paddingHorizontal: 34,
    paddingVertical: 28,
    elevation: 7,
    shadowColor: "#4d6215",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  compactCard: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d9f536",
    borderColor: "#739a15",
    borderWidth: 2,
    marginRight: 10,
  },
  brandMarkText: {
    color: "#355b18",
    fontSize: 12,
    fontWeight: "900",
  },
  brandText: {
    flexShrink: 1,
    color: "#6d782c",
    fontSize: 14,
    fontWeight: "800",
  },
  title: {
    color: "#315b1a",
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 48,
  },
  compactTitle: {
    fontSize: 32,
    lineHeight: 36,
  },
  subtitle: {
    color: "#56633b",
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 29,
    marginTop: 12,
    marginBottom: 24,
  },
  compactSubtitle: {
    fontSize: 17,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 16,
  },
  startButton: {
    minHeight: 64,
    borderRadius: 22,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#73a91f",
    borderBottomColor: "#4f7f12",
    borderBottomWidth: 5,
    elevation: 4,
  },
  startButtonPressed: {
    opacity: 0.9,
    transform: [{ translateY: 2 }, { scale: 0.985 }],
    borderBottomWidth: 3,
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  startButtonArrow: {
    color: "#fff6b8",
    fontSize: 29,
    fontWeight: "900",
    marginLeft: 12,
  },
  sunGlow: {
    position: "absolute",
    width: 430,
    height: 430,
    borderRadius: 215,
    left: -90,
    top: -160,
    backgroundColor: "#f7dc55",
    opacity: 0.32,
  },
  orangeDot: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    right: -35,
    bottom: -30,
    backgroundColor: "#f6a53a",
    opacity: 0.3,
  },
  limeDot: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    right: 32,
    top: 22,
    backgroundColor: "#c7e936",
    opacity: 0.5,
  },
});
