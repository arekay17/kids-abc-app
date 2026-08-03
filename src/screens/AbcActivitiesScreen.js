import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActivityCard from "../components/ActivityCard";

const KAK_LIMAU = require("../../assets/mascot/kak-limau-pointing-right.png");

const PALETTE = {
  background: "#f2fbf4",
  lowerAccent: "#dff3c4",
  ink: "#294524",
  mutedInk: "#66705b",
  bubbleBorder: "#a8c93a",
};

const ACTIVITIES = [
  {
    number: 1,
    route: "MengenalSemuaHuruf",
    title: "Kenal Huruf",
    fullTitle: "Mengenal Semua Huruf",
    description: "Kenali huruf A hingga Z",
    symbol: "ABC",
    accentColor: "#f6b92b",
    softColor: "#fff3bd",
    deepColor: "#d97706",
  },
  {
    number: 2,
    route: "CariHuruf",
    title: "Cari Huruf",
    description: "Cari huruf yang betul",
    symbol: "🔎",
    accentColor: "#38bdf8",
    softColor: "#dff5ff",
    deepColor: "#0284c7",
  },
  {
    number: 3,
    route: "HurufPertama",
    title: "Huruf Pertama",
    description: "Cari bunyi awal perkataan",
    symbol: "A...",
    accentColor: "#9b87f5",
    softColor: "#eee9ff",
    deepColor: "#7c3aed",
  },
  {
    number: 4,
    route: "PadankanHuruf",
    title: "Padankan Huruf",
    fullTitle: "Huruf Besar & Huruf Kecil",
    description: "Padankan A dengan a",
    symbol: "A ↔ a",
    accentColor: "#fb7185",
    softColor: "#ffe5e9",
    deepColor: "#e11d48",
  },
];

function MascotPanel({
  compact,
  mascotHeight,
  mascotStyle,
  bubbleStyle,
  decorationStyle,
}) {
  return (
    <View style={styles.mascotPanel}>
      <Animated.View
        pointerEvents="none"
        style={[styles.mascotDecorations, decorationStyle]}
      >
        <Text style={[styles.star, styles.starOne]}>★</Text>
        <Text style={[styles.star, styles.starTwo]}>✦</Text>
        {!compact && <Text style={[styles.star, styles.starThree]}>A</Text>}
      </Animated.View>

      {!compact && (
        <Animated.View style={[styles.speechBubble, bubbleStyle]}>
          <Text style={styles.speechText}>Pilih satu aktiviti!</Text>
          <View style={styles.speechTail} />
        </Animated.View>
      )}

      <Animated.View style={mascotStyle}>
        <Image
          accessibilityLabel="Kak Limau memperkenalkan pilihan aktiviti"
          resizeMode="contain"
          source={KAK_LIMAU}
          style={{ height: mascotHeight, width: mascotHeight * (2 / 3) }}
        />
      </Animated.View>
    </View>
  );
}

export default function AbcActivitiesScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 900 || height < 430;
  const showDescriptions = height >= 365;
  const mascotPanelWidth = Math.min(width * (isCompact ? 0.23 : 0.25), 330);
  const estimatedContentHeight = height - (isCompact ? 62 : 82);
  const mascotHeight = Math.max(
    190,
    Math.min(
      estimatedContentHeight * (isCompact ? 0.88 : 0.76),
      mascotPanelWidth * 1.38,
      560,
    ),
  );
  const cardWidth = isCompact
    ? Math.max(184, Math.min(210, width * 0.27))
    : Math.min(250, Math.max(230, width * 0.235));
  const cardHeight = isCompact
    ? Math.max(170, Math.min(196, height * 0.55))
    : Math.max(205, Math.min(225, height * 0.55));
  const cardSpacing = isCompact ? 12 : 16;

  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const showSwipeHintRef = useRef(true);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const rowOpacity = useRef(new Animated.Value(0)).current;
  const rowY = useRef(new Animated.Value(14)).current;
  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const mascotEntranceX = useRef(new Animated.Value(30)).current;
  const mascotIdleY = useRef(new Animated.Value(0)).current;
  const mascotPresentX = useRef(new Animated.Value(0)).current;
  const mascotPresentScale = useRef(new Animated.Value(1)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleY = useRef(new Animated.Value(8)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const decorationOpacity = useRef(new Animated.Value(0)).current;
  const decorationY = useRef(new Animated.Value(0)).current;
  const swipeHintX = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef(
    ACTIVITIES.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(14),
      scale: new Animated.Value(0.97),
    })),
  ).current;
  const entranceAnimation = useRef(null);
  const mascotEntranceAnimation = useRef(null);
  const mascotIdleAnimation = useRef(null);
  const mascotPresentAnimation = useRef(null);
  const bubbleAnimation = useRef(null);
  const decorationAnimation = useRef(null);
  const decorationIdleAnimation = useRef(null);
  const cardEntranceAnimation = useRef(null);
  const swipeHintAnimation = useRef(null);
  const animationRun = useRef(0);

  const stopAnimations = useCallback(() => {
    animationRun.current += 1;
    entranceAnimation.current?.stop();
    mascotEntranceAnimation.current?.stop();
    mascotIdleAnimation.current?.stop();
    mascotPresentAnimation.current?.stop();
    bubbleAnimation.current?.stop();
    decorationAnimation.current?.stop();
    decorationIdleAnimation.current?.stop();
    cardEntranceAnimation.current?.stop();
    swipeHintAnimation.current?.stop();
  }, []);

  const resetAnimatedValues = useCallback(() => {
    headerOpacity.setValue(0);
    rowOpacity.setValue(0);
    rowY.setValue(14);
    mascotOpacity.setValue(0);
    mascotEntranceX.setValue(30);
    mascotIdleY.setValue(0);
    mascotPresentX.setValue(0);
    mascotPresentScale.setValue(1);
    bubbleOpacity.setValue(0);
    bubbleY.setValue(8);
    bubbleScale.setValue(1);
    decorationOpacity.setValue(0);
    decorationY.setValue(0);
    swipeHintX.setValue(0);
    cardAnimations.forEach((animation) => {
      animation.opacity.setValue(0);
      animation.translateY.setValue(14);
      animation.scale.setValue(0.97);
    });
  }, [
    bubbleOpacity,
    bubbleScale,
    bubbleY,
    cardAnimations,
    decorationOpacity,
    decorationY,
    headerOpacity,
    mascotEntranceX,
    mascotIdleY,
    mascotOpacity,
    mascotPresentScale,
    mascotPresentX,
    rowOpacity,
    rowY,
    swipeHintX,
  ]);

  const startAnimations = useCallback(() => {
    stopAnimations();
    resetAnimatedValues();
    const runId = animationRun.current;

    entranceAnimation.current = Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(70),
        Animated.parallel([
          Animated.timing(rowOpacity, {
            toValue: 1,
            duration: 390,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(rowY, {
            toValue: 0,
            duration: 410,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    cardEntranceAnimation.current = Animated.stagger(
      75,
      cardAnimations.map((animation) =>
        Animated.parallel([
          Animated.timing(animation.opacity, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(animation.translateY, {
            toValue: 0,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(animation.scale, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    mascotEntranceAnimation.current = Animated.sequence([
      Animated.delay(110),
      Animated.parallel([
        Animated.timing(mascotOpacity, {
          toValue: 1,
          duration: 440,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(mascotEntranceX, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.06)),
          useNativeDriver: true,
        }),
      ]),
    ]);

    decorationAnimation.current = Animated.sequence([
      Animated.delay(280),
      Animated.timing(decorationOpacity, {
        toValue: 1,
        duration: 330,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    bubbleAnimation.current = Animated.sequence([
      Animated.delay(560),
      Animated.parallel([
        Animated.timing(bubbleOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bubbleY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(bubbleScale, {
        toValue: 1.03,
        duration: 150,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(bubbleScale, {
        toValue: 1,
        duration: 150,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]);

    entranceAnimation.current.start();
    cardEntranceAnimation.current.start();
    decorationAnimation.current.start(({ finished }) => {
      if (!finished || animationRun.current !== runId) return;

      decorationIdleAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(decorationY, {
            toValue: -3,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(decorationY, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      decorationIdleAnimation.current.start();
    });
    bubbleAnimation.current.start();
    mascotEntranceAnimation.current.start(({ finished }) => {
      if (!finished || animationRun.current !== runId) return;

      mascotIdleAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(mascotIdleY, {
            toValue: -3,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(mascotIdleY, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

      mascotPresentAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.delay(4600),
          Animated.parallel([
            Animated.timing(mascotPresentX, {
              toValue: -4,
              duration: 220,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(mascotPresentScale, {
              toValue: 1.015,
              duration: 220,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(mascotPresentX, {
              toValue: 0,
              duration: 220,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(mascotPresentScale, {
              toValue: 1,
              duration: 220,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ]),
      );

      mascotIdleAnimation.current.start();
      mascotPresentAnimation.current.start();
    });

    if (showSwipeHintRef.current) {
      swipeHintAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.delay(650),
          Animated.timing(swipeHintX, {
            toValue: 7,
            duration: 300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(swipeHintX, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 },
      );
      swipeHintAnimation.current.start();
    }
  }, [
    bubbleOpacity,
    bubbleScale,
    bubbleY,
    cardAnimations,
    decorationOpacity,
    decorationY,
    headerOpacity,
    mascotEntranceX,
    mascotIdleY,
    mascotOpacity,
    mascotPresentScale,
    mascotPresentX,
    resetAnimatedValues,
    rowOpacity,
    rowY,
    stopAnimations,
    swipeHintX,
  ]);

  useFocusEffect(
    useCallback(() => {
      startAnimations();
      return () => {
        stopAnimations();
        resetAnimatedValues();
      };
    }, [resetAnimatedValues, startAnimations, stopAnimations]),
  );

  const handleScrollBegin = useCallback(() => {
    if (!showSwipeHint) return;

    showSwipeHintRef.current = false;
    setShowSwipeHint(false);
    swipeHintAnimation.current?.stop();
    swipeHintX.setValue(0);
  }, [showSwipeHint, swipeHintX]);

  const renderActivity = useCallback(
    ({ item, index }) => {
      const animation = cardAnimations[index];

      return (
        <ActivityCard
          activity={item}
          width={cardWidth}
          height={cardHeight}
          compact={isCompact}
          showDescription={showDescriptions}
          animatedStyle={{
            opacity: animation.opacity,
            transform: [
              { translateY: animation.translateY },
              { scale: animation.scale },
            ],
          }}
          onPress={() => navigation.navigate(item.route)}
        />
      );
    },
    [
      cardAnimations,
      cardHeight,
      cardWidth,
      isCompact,
      navigation,
      showDescriptions,
    ],
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={styles.safeArea}
    >
      <View pointerEvents="none" style={styles.backgroundDecorations}>
        <View style={[styles.backgroundCircle, styles.circleOne]} />
        <View style={[styles.backgroundCircle, styles.circleTwo]} />
        <Text style={[styles.backgroundLetter, styles.letterA]}>A</Text>
        {!isCompact && (
          <Text style={[styles.backgroundLetter, styles.letterB]}>b</Text>
        )}
        <View style={styles.lowerAccent} />
      </View>

      <Animated.View
        style={[
          styles.header,
          isCompact && styles.compactHeader,
          { opacity: headerOpacity },
        ]}
      >
        <Pressable
          accessibilityLabel="Kembali"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            isCompact && styles.compactBackButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Text style={[styles.backText, isCompact && styles.compactBackText]}>
            ← Kembali
          </Text>
        </Pressable>

        <View style={styles.heading}>
          <Text style={[styles.title, isCompact && styles.compactTitle]}>
            Aktiviti ABC
          </Text>
          <Text style={[styles.subtitle, isCompact && styles.compactSubtitle]}>
            Pilih aktiviti yang adik suka!
          </Text>
        </View>
        <View style={[styles.headerSpacer, isCompact && styles.compactSpacer]} />
      </Animated.View>

      <View style={styles.contentRow}>
        <Animated.View
          style={[
            styles.activityArea,
            { opacity: rowOpacity, transform: [{ translateY: rowY }] },
          ]}
        >
          <FlatList
            contentContainerStyle={[
              styles.listContent,
              {
                gap: cardSpacing,
                paddingHorizontal: isCompact ? 10 : 16,
              },
            ]}
            data={ACTIVITIES}
            horizontal
            initialNumToRender={ACTIVITIES.length}
            keyExtractor={(item) => item.route}
            onScrollBeginDrag={handleScrollBegin}
            removeClippedSubviews={false}
            renderItem={renderActivity}
            showsHorizontalScrollIndicator={false}
            style={styles.activityList}
          />

          {showSwipeHint && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.swipeHint,
                isCompact && styles.compactSwipeHint,
                { transform: [{ translateX: swipeHintX }] },
              ]}
            >
              <Text style={styles.swipeHintText}>Leret untuk lihat lagi ↔</Text>
            </Animated.View>
          )}
        </Animated.View>

        <View style={{ width: mascotPanelWidth }}>
          <MascotPanel
            compact={isCompact}
            mascotHeight={mascotHeight}
            mascotStyle={{
              opacity: mascotOpacity,
              transform: [
                { translateX: mascotEntranceX },
                { translateY: mascotIdleY },
                { translateX: mascotPresentX },
                { scale: mascotPresentScale },
              ],
            }}
            bubbleStyle={{
              opacity: bubbleOpacity,
              transform: [
                { translateY: bubbleY },
                { scale: bubbleScale },
              ],
            }}
            decorationStyle={{
              opacity: decorationOpacity,
              transform: [{ translateY: decorationY }],
            }}
          />
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
  backgroundDecorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  lowerAccent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "24%",
    backgroundColor: PALETTE.lowerAccent,
    opacity: 0.72,
  },
  backgroundCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#bce7ef",
    opacity: 0.28,
  },
  circleOne: {
    width: 180,
    height: 180,
    left: "8%",
    top: "18%",
  },
  circleTwo: {
    width: 130,
    height: 130,
    right: "28%",
    bottom: "5%",
    backgroundColor: "#fbd6dc",
  },
  backgroundLetter: {
    position: "absolute",
    color: PALETTE.ink,
    fontSize: 70,
    fontWeight: "900",
    opacity: 0.045,
  },
  letterA: {
    left: "3%",
    bottom: "3%",
    transform: [{ rotate: "-10deg" }],
  },
  letterB: {
    right: "33%",
    top: "12%",
    transform: [{ rotate: "8deg" }],
  },
  header: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  compactHeader: {
    minHeight: 60,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  backButton: {
    width: 112,
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: PALETTE.bubbleBorder,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  compactBackButton: {
    width: 92,
    minHeight: 44,
  },
  backButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
  backText: {
    color: PALETTE.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  compactBackText: {
    fontSize: 14,
  },
  heading: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  title: {
    color: PALETTE.ink,
    fontSize: 33,
    lineHeight: 38,
    fontWeight: "900",
    textAlign: "center",
  },
  compactTitle: {
    fontSize: 27,
    lineHeight: 31,
  },
  subtitle: {
    color: PALETTE.mutedInk,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 1,
    textAlign: "center",
  },
  compactSubtitle: {
    fontSize: 13,
  },
  headerSpacer: {
    width: 112,
  },
  compactSpacer: {
    width: 92,
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",
    minHeight: 0,
  },
  activityArea: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    justifyContent: "center",
    paddingBottom: 4,
  },
  activityList: {
    flexGrow: 0,
  },
  listContent: {
    alignItems: "center",
    paddingVertical: 8,
  },
  swipeHint: {
    position: "absolute",
    right: 18,
    bottom: 3,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    elevation: 2,
  },
  compactSwipeHint: {
    right: 10,
    bottom: 0,
    paddingVertical: 3,
  },
  swipeHintText: {
    color: PALETTE.ink,
    fontSize: 11,
    fontWeight: "900",
  },
  mascotPanel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mascotDecorations: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: "absolute",
    color: "#f4b41f",
    fontWeight: "900",
  },
  starOne: {
    left: "6%",
    top: "36%",
    fontSize: 18,
  },
  starTwo: {
    right: "9%",
    top: "21%",
    fontSize: 22,
    color: "#86b72f",
  },
  starThree: {
    right: "3%",
    bottom: "14%",
    fontSize: 25,
    color: "#38bdf8",
    opacity: 0.58,
  },
  speechBubble: {
    zIndex: 2,
    maxWidth: 190,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: PALETTE.bubbleBorder,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: -4,
    elevation: 3,
  },
  speechText: {
    color: PALETTE.ink,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  speechTail: {
    position: "absolute",
    bottom: -7,
    left: "28%",
    width: 13,
    height: 13,
    backgroundColor: "#ffffff",
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: PALETTE.bubbleBorder,
    transform: [{ rotate: "-45deg" }],
  },
});
