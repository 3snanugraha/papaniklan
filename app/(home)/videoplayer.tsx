import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Video as ExpoVideo, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { getVideos } from "../../utils/database";
import { Video } from "../../types";

const { width, height } = Dimensions.get("window");

export default function VideoPlayerScreen() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<ExpoVideo>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playNextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
      setProgress(0);
    } else {
      // Loop back to first video
      setCurrentVideoIndex(0);
      setProgress(0);
    }
  };

  const playPreviousVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
      setProgress(0);
    } else {
      // Loop to last video
      setCurrentVideoIndex(videos.length - 1);
      setProgress(0);
    }
  };

  const handleVideoFinish = () => {
    playNextVideo();
  };

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded && status.durationMillis) {
      setProgress(status.positionMillis / status.durationMillis);
    }

    if (status.didJustFinish) {
      handleVideoFinish();
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
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

  const currentVideo = videos[currentVideoIndex];

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      {/* Video Player */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleVideoPress}
        className="flex-1 justify-center items-center"
      >
        {currentVideo && (
          <ExpoVideo
            ref={videoRef}
            source={{ uri: currentVideo.uri }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isPlaying}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            style={{ width, height: height * 0.8 }}
          />
        )}
      </TouchableOpacity>

      {/* Controls Overlay */}
      {showControls && (
        <View className="absolute inset-0 bg-black/40 justify-between">
          {/* Top Bar */}
          <LinearGradient
            colors={["rgba(0,0,0,0.8)", "transparent"]}
            className="px-5 pt-12 pb-6"
          >
            <View className="flex-row items-center justify-between">
              <TouchableOpacity className="p-2" onPress={() => router.back()}>
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
                {currentVideo?.duration
                  ? formatTime(progress * currentVideo.duration * 1000)
                  : "0:00"}
              </Text>
              <Text className="text-white text-xs">
                {currentVideo?.duration
                  ? formatTime(currentVideo.duration * 1000)
                  : "Unknown"}
              </Text>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}
