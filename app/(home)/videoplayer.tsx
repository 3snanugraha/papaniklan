import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { getVideos } from "../../utils/database";
import { Video } from "../../types";

const { width, height } = Dimensions.get("window");

export default function VideoPlayerScreen() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set landscape orientation when component mounts
  useEffect(() => {
    const setLandscape = async () => {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    };

    setLandscape();

    // Return to portrait when unmounting
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
  }, []);

  // Load videos on mount
  useEffect(() => {
    loadVideos();

    // Auto-hide controls after 3 seconds
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => {
      if (timeout) clearTimeout(timeout);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const loadVideos = async () => {
    try {
      const loadedVideos = await getVideos();

      if (loadedVideos.length === 0) {
        Alert.alert(
          "No Videos",
          "You don't have any videos to play. Please add some videos first.",
          [{ text: "OK", onPress: () => router.back() }]
        );
        return;
      }

      // Sort videos by order_index if available
      const sortedVideos = [...loadedVideos].sort((a, b) => {
        if (a.order_index !== undefined && b.order_index !== undefined) {
          return a.order_index - b.order_index;
        }
        return 0;
      });

      setVideos(sortedVideos);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading videos:", error);
      Alert.alert("Error", "Failed to load videos");
      router.back();
    }
  };

  // Initialize video player
  const currentVideo = videos[currentVideoIndex];
  const videoSource = currentVideo?.uri || "";

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.timeUpdateEventInterval = 0.5; // Update time every 0.5 seconds

    // Start playing when ready
    if (!isLoading) {
      player.play();
    }
  });

  // Use the useEvent hook to track player state
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player?.playing || false,
  });

  // Set up time update event to track progress
  useEffect(() => {
    if (!player) return;

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
      handleVideoFinish();
    });

    return () => {
      timeUpdateSubscription.remove();
      playToEndSubscription.remove();
    };
  }, [player, currentVideoIndex]);

  // Update player when video index changes
  useEffect(() => {
    if (player && currentVideo) {
      player.replace(currentVideo.uri);
    }
  }, [currentVideoIndex, currentVideo]);

  const handleVideoPress = () => {
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
    if (player) {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  const playNextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
      setProgress(0);
      setCurrentPosition(0);
    } else {
      // Loop back to first video
      setCurrentVideoIndex(0);
      setProgress(0);
      setCurrentPosition(0);
    }
  };

  const playPreviousVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
      setProgress(0);
      setCurrentPosition(0);
    } else {
      // Loop to last video
      setCurrentVideoIndex(videos.length - 1);
      setProgress(0);
      setCurrentPosition(0);
    }
  };

  const handleVideoFinish = () => {
    playNextVideo();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#407BFF" />
        <Text className="text-white mt-4">Loading videos...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" hidden={true} />

      {/* Video Player */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleVideoPress}
        className="flex-1 justify-center items-center"
      >
        {currentVideo && (
          <VideoView
            style={styles.videoView}
            player={player}
            allowsFullscreen={false}
            nativeControls={false}
            contentFit="contain"
          />
        )}
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
              <TouchableOpacity
                className="p-2"
                onPress={async () => {
                  // Return to portrait mode before going back
                  await ScreenOrientation.lockAsync(
                    ScreenOrientation.OrientationLock.PORTRAIT
                  );
                  router.back();
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text className="text-white font-medium">
                {currentVideoIndex + 1} / {videos.length}
              </Text>
              <View style={{ width: 28 }} />
            </View>
            <Text
              className="text-white text-xl font-bold mt-2"
              numberOfLines={1}
            >
              {currentVideo?.title || "Untitled Video"}
            </Text>
          </LinearGradient>

          {/* Center Controls */}
          <View className="flex-row justify-center items-center px-10">
            <TouchableOpacity className="p-4" onPress={playPreviousVideo}>
              <Ionicons name="play-skip-back" size={40} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              className="p-6 mx-8 bg-white/20 rounded-full"
              onPress={togglePlayPause}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={50}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity className="p-4" onPress={playNextVideo}>
              <Ionicons name="play-skip-forward" size={40} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bottom Bar */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            className="px-5 pt-6 pb-10"
          >
            {/* Progress Bar */}
            <View className="h-1 bg-gray-700 rounded-full mb-2 overflow-hidden">
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
                {duration ? formatTime(duration) : "Unknown"}
              </Text>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  videoView: {
    width: "100%",
    height: "100%",
  },
});
