import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  getVideos,
  addVideo,
  updateVideo,
  deleteVideo,
} from "../../utils/database";
import { Video } from "../../types";
import { StatusBar } from "expo-status-bar";

// Import components
import UploadModal from "../components/UploadModal";
import VideoItem from "../components/VideoItem";
import EmptyState from "../components/EmptyState";
import AddVideoButton from "../components/AddVideoButton";

export default function VideoManagerScreen() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // Load videos when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadVideos();
    }, [])
  );

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const loadedVideos = await getVideos();
      setVideos(loadedVideos);
    } catch (error) {
      console.error("Error loading videos:", error);
      Alert.alert("Error", "Failed to load videos");
    } finally {
      setIsLoading(false);
    }
  };

  const openAddVideoModal = () => {
    setEditingVideo(null);
    setModalVisible(true);
  };

  const openEditVideoModal = (video: Video) => {
    setEditingVideo(video);
    setModalVisible(true);
  };

  const handleSaveVideo = async (videoData: Partial<Video>) => {
    try {
      if (editingVideo) {
        // Update existing video
        await updateVideo(editingVideo.id, videoData);
        Alert.alert("Success", "Video Berhasil diupdate");
      } else {
        // Add new video
        await addVideo(videoData);
        Alert.alert("Success", "Video Berhasil ditambahkan");
      }

      setModalVisible(false);
      loadVideos();
    } catch (error) {
      console.error("Error saat menyimpan Video:", error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  const handleDeleteVideo = (video: Video) => {
    Alert.alert(
      "Konfirmasi",
      `Apakah kamu yakin akan menghapus video "${video.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVideo(video.id);
              loadVideos();
              Alert.alert("Sukses", "Video Berhasil dihapus");
            } catch (error) {
              console.error("Error saat menghapus video:", error);
              Alert.alert("Error", "Gagal menghapus video");
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <LinearGradient
        colors={["#407BFF", "#2A5CDC", "#1E45B8"]}
        className="pt-12 pb-4 px-5"
      >
        <View className="flex-row items-center">
          <TouchableOpacity className="mr-4 p-2" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text className="text-white text-xl font-bold">Kelola Video</Text>
            <Text className="text-blue-100 text-xs mt-1">
              Tambah, edit atau hapus video
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View className="flex-1 px-5 pt-4">
        {/* Add Video Button */}
        <AddVideoButton onPress={openAddVideoModal} />

        {/* Video List */}
        <Text className="text-lg font-bold text-gray-800 mb-3">
          Video saat ini ({videos.length})
        </Text>

        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#407BFF" />
            <Text className="text-gray-500 mt-4">Memuat videos...</Text>
          </View>
        ) : videos.length > 0 ? (
          <FlatList
            data={videos}
            renderItem={({ item }) => (
              <VideoItem
                video={item}
                onEdit={openEditVideoModal}
                onDelete={handleDeleteVideo}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          <EmptyState
            title="Tidak ada video"
            message="Ketuk `Tambah Video Baru` untuk memulai"
          />
        )}
      </View>

      {/* Upload Modal */}
      <UploadModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveVideo}
        editingVideo={editingVideo}
      />
    </View>
  );
}
