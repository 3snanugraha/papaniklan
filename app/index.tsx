import { useEffect, useState, useRef } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
} from "react-native";
import { router } from "expo-router";
import { initDatabase } from "../utils/database";

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Spin interpolation for loading circle
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    // Start spinning animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Setup app initialization
    const setupApp = async () => {
      try {
        // Step 1: Initialize database
        setLoadingMessage("Setting up database...");
        setLoadingProgress(0.3);
        await initDatabase();

        // Step 2: Any other initialization tasks
        setLoadingMessage("Loading resources...");
        setLoadingProgress(0.6);
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Step 3: Prepare video cache
        setLoadingMessage("Preparing video cache...");
        setLoadingProgress(0.9);
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Step 4: Complete loading
        setLoadingMessage("Ready!");
        setLoadingProgress(1);
        setIsLoading(false);

        // Exit animation and navigate
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            delay: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            delay: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          router.replace("/(home)");
        });
      } catch (error) {
        console.error("Initialization error:", error);
        setLoadingMessage("Error initializing app. Please restart.");
      }
    };

    setupApp();
  }, []);

  return (
    <View className="flex-1 bg-white justify-center items-center p-6">
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="items-center"
      >
        {/* App Logo */}
        <View className="mb-8 items-center">
          <View className="w-32 h-32 rounded-3xl items-center justify-center mb-4 overflow-hidden">
            <Image
              source={require("../assets/images/logo.png")}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
          <Text className="text-3xl font-bold text-[#407BFF]">
            Papan Iklan
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            Your personal video slideshow
          </Text>
        </View>

        {/* Custom loading indicator */}
        <View className="h-16 items-center justify-center mb-2">
          {isLoading ? (
            <View className="items-center">
              <Animated.View
                style={{
                  transform: [{ rotate: spin }],
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 3,
                  borderColor: "#407BFF",
                  borderTopColor: "transparent",
                  marginBottom: 12,
                }}
              />
            </View>
          ) : (
            <View className="items-center">
              <View className="w-10 h-10 bg-[#407BFF] rounded-full items-center justify-center">
                <Text className="text-white font-bold">✓</Text>
              </View>
            </View>
          )}
        </View>

        {/* Loading message */}
        <Text className="text-gray-600 text-center mb-8">{loadingMessage}</Text>

        {/* Progress bar */}
        <View className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-[#407BFF]"
            style={{ width: `${loadingProgress * 100}%` }}
          />
        </View>

        {/* Version info */}
        <Text className="text-gray-400 text-xs mt-12">Version 1.0.0</Text>
      </Animated.View>
    </View>
  );
}
