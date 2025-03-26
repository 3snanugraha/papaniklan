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
import { Media } from "../../types";

export default function HomeScreen() {
  const [mediaCount, setMediaCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentMedia, setRecentMedia] = useState<Media[]>([]);
  const [mediaStats, setMediaStats] = useState({ videos: 0, images: 0 });

  // Function to load media data
  const loadData = async () => {
    try {
      const media = await getVideos();
      setMediaCount(media.length);
      setRecentMedia(media.slice(0, 3));

      // Calculate stats
      const videoCount = media.filter(
        (item) => item.type === "video" || !item.type
      ).length;
      const imageCount = media.filter((item) => item.type === "image").length;
      setMediaStats({ videos: videoCount, images: imageCount });
    } catch (error) {
      console.error("Error memuat media:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Refresh when screen comes into focus (returning from media manager)
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

  // Helper function to get media type icon
  const getMediaTypeIcon = (type?: string) => {
    return type === "image" ? "image" : "videocam";
  };

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
              Slideshow media pribadimu
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
              : mediaCount > 0
              ? `Anda memiliki ${mediaCount} media dalam koleksi`
              : "Belum ada media. Mulai dengan menambahkan beberapa!"}
          </Text>

          {mediaCount > 0 && !isLoading && (
            <View className="flex-row">
              <View className="flex-row items-center bg-white/30 rounded-lg px-3 py-1.5 mr-2">
                <Ionicons name="videocam" size={16} color="#fff" />
                <Text className="text-white text-xs ml-1">
                  {mediaStats.videos} Video
                </Text>
              </View>
              <View className="flex-row items-center bg-white/30 rounded-lg px-3 py-1.5">
                <Ionicons name="image" size={16} color="#fff" />
                <Text className="text-white text-xs ml-1">
                  {mediaStats.images} Gambar
                </Text>
              </View>
            </View>
          )}
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
              disabled={mediaCount === 0}
              style={{ opacity: mediaCount === 0 ? 0.7 : 1 }}
            >
              <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="play-circle" size={40} color="#407BFF" />
              </View>
              <Text className="font-semibold text-gray-800">Putar Media</Text>
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
                Tambah atau edit media
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Bagian media terbaru */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Media Terbaru
          </Text>

          {isLoading ? (
            <View className="bg-white rounded-xl p-4 shadow-sm items-center justify-center h-24">
              <ActivityIndicator size="small" color="#407BFF" />
              <Text className="text-gray-400 mt-2">
                Memuat media terbaru...
              </Text>
            </View>
          ) : recentMedia.length > 0 ? (
            recentMedia.map((media) => (
              <View
                key={media.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center"
              >
                <View className="w-16 h-16 bg-gray-200 rounded-lg mr-4 items-center justify-center overflow-hidden">
                  {media.thumbnail ? (
                    <Image
                      source={{ uri: media.thumbnail }}
                      className="w-full h-full"
                    />
                  ) : (
                    <Ionicons
                      name={getMediaTypeIcon(media.type)}
                      size={24}
                      color="#407BFF"
                    />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text
                      className="font-medium text-gray-800"
                      numberOfLines={1}
                    >
                      {media.title || "Media Tanpa Judul"}
                    </Text>
                    {media.type === "image" && (
                      <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
                        <Text className="text-xs text-blue-700">Gambar</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-500 mt-1">
                    {media.type === "image"
                      ? "Durasi: 8 detik"
                      : media.duration
                      ? `${Math.floor(media.duration / 60)}:${(
                          media.duration % 60
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
                name="images-outline"
                size={40}
                color="#d1d5db"
                className="mb-2"
              />
              <Text className="text-gray-400 text-center">Belum ada media</Text>
              <Text className="text-xs text-gray-400 text-center mt-1">
                Media terbaru Anda akan muncul di sini
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
              Anda dapat membuat slideshow yang indah dengan menyusun video dan
              gambar sesuai urutan yang Anda inginkan. Gambar akan ditampilkan
              selama 8 detik sebelum beralih ke media berikutnya.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
