import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getVideos } from "../../utils/database";
import { Video } from "../../types";

export default function HomeScreen() {
  const [videoCount, setVideoCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);

  // Function to load videos data
  const loadData = async () => {
    try {
      const videos = await getVideos();
      setVideoCount(videos.length);
      setRecentVideos(videos.slice(0, 3));
    } catch (error) {
      console.error("Error memuat video:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Refresh when screen comes into focus (returning from video manager)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header dengan gradient */}
      <LinearGradient
        colors={["#407BFF", "#2A5CDC", "#1E45B8"]}
        className="pt-12 pb-6 px-5 rounded-b-3xl"
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">Papan Iklan</Text>
            <Text className="text-blue-100 text-sm mt-1">
              Slideshow video pribadimu
            </Text>
          </View>
          <Image
            source={require("../../assets/images/logo.png")}
            className="w-12 h-12 rounded-xl"
            resizeMode="contain"
          />
        </View>

        <View className="mt-6 bg-white/20 p-4 rounded-xl">
          <Text className="text-white text-base mb-2">
            {isLoading
              ? "Memuat koleksi anda..."
              : videoCount > 0
              ? `Anda memiliki ${videoCount} video dalam koleksi`
              : "Belum ada video. Mulai dengan menambahkan beberapa!"}
          </Text>

          <View className="flex-row">
            <View className="flex-row items-center bg-white/30 rounded-lg px-3 py-1.5">
              <Ionicons name="play" size={16} color="#fff" />
              <Text className="text-white text-xs ml-1">Siap diputar</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 px-5 pt-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#407BFF"]}
            tintColor="#407BFF"
          />
        }
      >
        {/* Tombol aksi utama */}
        <View className="flex-row justify-between mb-8">
          <Link href="/(home)/videoplayer" asChild>
            <TouchableOpacity
              className="bg-white rounded-2xl p-5 shadow-sm w-[48%] items-center border border-gray-100"
              disabled={videoCount === 0}
              style={{ opacity: videoCount === 0 ? 0.7 : 1 }}
            >
              <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="play-circle" size={40} color="#407BFF" />
              </View>
              <Text className="font-semibold text-gray-800">Putar Video</Text>
              <Text className="text-xs text-gray-500 mt-1">
                Mulai slideshow
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(home)/videomanager" asChild>
            <TouchableOpacity className="bg-white rounded-2xl p-5 shadow-sm w-[48%] items-center border border-gray-100">
              <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="cloud-upload" size={36} color="#407BFF" />
              </View>
              <Text className="font-semibold text-gray-800">Kelola</Text>
              <Text className="text-xs text-gray-500 mt-1">
                Tambah atau edit video
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Bagian video terbaru */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Video Terbaru
          </Text>

          {isLoading ? (
            <View className="bg-white rounded-xl p-4 shadow-sm items-center justify-center h-24">
              <ActivityIndicator size="small" color="#407BFF" />
              <Text className="text-gray-400 mt-2">
                Memuat video terbaru...
              </Text>
            </View>
          ) : recentVideos.length > 0 ? (
            recentVideos.map((video, index) => (
              <View
                key={video.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center"
              >
                <View className="w-16 h-16 bg-gray-200 rounded-lg mr-4 items-center justify-center overflow-hidden">
                  {video.thumbnail ? (
                    <Image
                      source={{ uri: video.thumbnail }}
                      className="w-full h-full"
                    />
                  ) : (
                    <Ionicons name="videocam" size={24} color="#407BFF" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-800" numberOfLines={1}>
                    {video.title || "Video Tanpa Judul"}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    {video.duration
                      ? `${Math.floor(video.duration / 60)}:${(
                          video.duration % 60
                        )
                          .toString()
                          .padStart(2, "0")}`
                      : "Durasi tidak diketahui"}
                  </Text>
                </View>
                <Link href="/(home)/videoplayer" asChild>
                  <TouchableOpacity className="p-2">
                    <Ionicons name="play-circle" size={28} color="#407BFF" />
                  </TouchableOpacity>
                </Link>
              </View>
            ))
          ) : (
            <View className="bg-white rounded-xl p-6 shadow-sm items-center justify-center">
              <Ionicons
                name="videocam-outline"
                size={40}
                color="#d1d5db"
                className="mb-2"
              />
              <Text className="text-gray-400 text-center">Belum ada video</Text>
              <Text className="text-xs text-gray-400 text-center mt-1">
                Video terbaru Anda akan muncul di sini
              </Text>
            </View>
          )}
        </View>

        {/* Bagian tips cepat */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Tips Cepat
          </Text>

          <View className="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <View className="flex-row items-center mb-3">
              <Ionicons name="bulb" size={20} color="#407BFF" />
              <Text className="text-blue-800 font-medium ml-2">
                Tahukah Anda?
              </Text>
            </View>
            <Text className="text-blue-700 text-sm">
              Anda dapat membuat slideshow yang indah dengan menyusun video
              sesuai urutan yang Anda inginkan. Coba tambahkan video dengan tema
              serupa untuk pengalaman yang lebih menyatu.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
