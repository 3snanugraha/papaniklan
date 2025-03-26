import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { getVideos } from "../../utils/database";
import { Media } from "../../types";

const { width, height } = Dimensions.get("window");

export default function MediaPlayerScreen() {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load media on mount
  useEffect(() => {
    loadMedia();

    // Auto-hide controls after 3 seconds
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => {
      if (timeout) clearTimeout(timeout);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    };
  }, []);

  const loadMedia = async () => {
    try {
      const loadedMedia = await getVideos();

      if (loadedMedia.length === 0) {
        Alert.alert(
          "Tidak Ada Media",
          "Anda belum memiliki media untuk diputar. Silakan tambahkan beberapa media terlebih dahulu.",
          [{ text: "OK", onPress: () => router.back() }]
        );
        return;
      }

      // Sort media by order_index if available
      const sortedMedia = [...loadedMedia].sort((a, b) => {
        if (a.order_index !== undefined && b.order_index !== undefined) {
          return a.order_index - b.order_index;
        }
        return 0;
      });

      setMediaItems(sortedMedia);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading media:", error);
      Alert.alert("Error", "Gagal memuat media");
      router.back();
    }
  };

  // Get current media item
  const currentMedia = mediaItems[currentIndex];
  const isCurrentImage = currentMedia?.type === "image";

  // Initialize video player (only for videos)
  const videoSource = !isCurrentImage ? currentMedia?.uri || "" : "";

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.timeUpdateEventInterval = 0.5; // Update time every 0.5 seconds

    // Start playing when ready
    if (!isLoading && !isCurrentImage) {
      player.play();
    }
  });

  // Use the useEvent hook to track player state
  const { isPlaying: videoIsPlaying } = useEvent(player, "playingChange", {
    isPlaying: player?.playing || false,
  });

  // Set up time update event to track progress
  useEffect(() => {
    if (!player || isCurrentImage) return;

    const timeUpdateSubscription = player.addListener(
      "timeUpdate",
      (payload) => {
        setCurrentPosition(payload.currentTime);
        if (player.duration > 0) {
          setProgress(payload.currentTime / player.duration);
          setDuration(player.duration);
        }
      }
    );

    // Listen for playback end
    const playToEndSubscription = player.addListener("playToEnd", () => {
      handleMediaFinish();
    });

    return () => {
      timeUpdateSubscription.remove();
      playToEndSubscription.remove();
    };
  }, [player, currentIndex, isCurrentImage]);

  // Handle image display with timer
  useEffect(() => {
    // Clear any existing image timer
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current);
      imageTimerRef.current = null;
    }

    if (isCurrentImage && !isLoading) {
      // Set initial state for image
      setIsPlaying(true);
      setDuration(8); // 8 seconds for images
      setProgress(0);
      setCurrentPosition(0);

      // Start progress timer for images
      let elapsed = 0;
      const updateInterval = 100; // Update every 100ms for smooth progress

      const progressInterval = setInterval(() => {
        elapsed += updateInterval / 1000;
        setCurrentPosition(elapsed);
        setProgress(elapsed / 8); // 8 seconds total

        if (elapsed >= 8) {
          clearInterval(progressInterval);
        }
      }, updateInterval);

      // Set timer to move to next media after 8 seconds
      imageTimerRef.current = setTimeout(() => {
        clearInterval(progressInterval);
        handleMediaFinish();
      }, 8000);

      return () => {
        clearInterval(progressInterval);
        if (imageTimerRef.current) {
          clearTimeout(imageTimerRef.current);
        }
      };
    }
  }, [currentIndex, isCurrentImage, isLoading]);

  // Update player when media index changes
  useEffect(() => {
    if (player && currentMedia && !isCurrentImage) {
      player.replace(currentMedia.uri);
    }
  }, [currentIndex, currentMedia, isCurrentImage]);

  const handleMediaPress = () => {
    setShowControls(!showControls);

    // Auto-hide controls after 3 seconds
    if (showControls === false && controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (!showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const togglePlayPause = () => {
    if (isCurrentImage) {
      // For images, pause/resume the timer
      setIsPlaying(!isPlaying);

      if (isPlaying) {
        // Pause - clear the timer
        if (imageTimerRef.current) {
          clearTimeout(imageTimerRef.current);
        }
      } else {
        // Resume - calculate remaining time and set new timer
        const remainingTime = (8 - currentPosition) * 1000;
        if (remainingTime > 0) {
          imageTimerRef.current = setTimeout(() => {
            handleMediaFinish();
          }, remainingTime);
        }
      }
    } else if (player) {
      // For videos, use the player controls
      if (videoIsPlaying) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  const playNextMedia = () => {
    // Clear image timer if exists
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current);
      imageTimerRef.current = null;
    }

    if (currentIndex < mediaItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Loop back to first media
      setCurrentIndex(0);
    }
  };

  const playPreviousMedia = () => {
    // Clear image timer if exists
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current);
      imageTimerRef.current = null;
    }

    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // Loop to last media
      setCurrentIndex(mediaItems.length - 1);
    }
  };

  const handleMediaFinish = () => {
    playNextMedia();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <StatusBar style="light" hidden={true} />
        <ActivityIndicator size="large" color="#407BFF" />
        <Text className="text-white mt-4">Memuat media...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Hide status bar completely */}
      <StatusBar style="light" hidden={true} />

      {/* Media Player */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleMediaPress}
        className="flex-1 justify-center items-center"
      >
        {currentMedia &&
          (isCurrentImage ? (
            // Image display
            <Image
              source={{ uri: currentMedia.uri }}
              style={styles.mediaView}
              resizeMode="contain"
            />
          ) : (
            // Video player
            <VideoView
              style={styles.mediaView}
              player={player}
              allowsFullscreen={false}
              nativeControls={false}
              contentFit="contain"
            />
          ))}
      </TouchableOpacity>

      {/* Controls Overlay */}
      {showControls && (
        <View className="absolute inset-0 bg-black/40 justify-between">
          {/* Top Bar */}
          <LinearGradient
            colors={["rgba(0,0,0,0.8)", "transparent"]}
            className="px-5 pt-6 pb-6"
          >
            <View className="flex-row items-center justify-between">
              <TouchableOpacity className="p-2" onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View className="flex-row items-center">
                <Text className="text-white font-medium">
                  {currentIndex + 1} / {mediaItems.length}
                </Text>
                {isCurrentImage && (
                  <View className="ml-2 bg-blue-500/50 px-2 py-0.5 rounded-full">
                    <Text className="text-xs text-white">Gambar</Text>
                  </View>
                )}
              </View>
              <View style={{ width: 28 }} />
            </View>
            <Text
              className="text-white text-xl font-bold mt-2"
              numberOfLines={1}
            >
              {currentMedia?.title || "Untitled Media"}
            </Text>
          </LinearGradient>

          {/* Center Controls */}
          <View className="flex-row justify-center items-center px-10">
            <TouchableOpacity className="p-4" onPress={playPreviousMedia}>
              <Ionicons name="play-skip-back" size={36} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              className="p-6 mx-8 bg-white/20 rounded-full"
              onPress={togglePlayPause}
            >
              <Ionicons
                name={
                  (isCurrentImage ? isPlaying : videoIsPlaying)
                    ? "pause"
                    : "play"
                }
                size={46}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity className="p-4" onPress={playNextMedia}>
              <Ionicons name="play-skip-forward" size={36} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bottom Bar */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            className="px-5 pt-6 pb-8"
          >
            {/* Progress Bar */}
            <View className="h-1.5 bg-gray-700 rounded-full mb-2 overflow-hidden">
              <View
                className="h-full bg-[#407BFF]"
                style={{ width: `${progress * 100}%` }}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-white text-xs">
                {formatTime(currentPosition)}
              </Text>
              <Text className="text-white text-xs">
                {isCurrentImage
                  ? "0:08"
                  : duration
                  ? formatTime(duration)
                  : "Unknown"}
              </Text>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mediaView: {
    width: "100%",
    height: "100%",
  },
});
