import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Pressable,
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
import { Media } from "../../types";
import { StatusBar } from "expo-status-bar";
import { Picker } from "@react-native-picker/picker";

// Import components
import UploadModal from "../components/UploadModal";
import MediaItem from "../components/VideoItem";
import EmptyState from "../components/EmptyState";
import AddMediaButton from "../components/AddVideoButton";

export default function MediaManagerScreen() {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<
    "all" | "video" | "image"
  >("all");

  // Load media when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadMedia();
    }, [])
  );

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const loadedMedia = await getVideos();
      setMediaItems(loadedMedia);
    } catch (error) {
      console.error("Error loading media:", error);
      Alert.alert("Error", "Gagal memuat media");
    } finally {
      setIsLoading(false);
    }
  };

  const openAddMediaModal = () => {
    setEditingMedia(null);
    setModalVisible(true);
  };

  const openEditMediaModal = (media: Media) => {
    setEditingMedia(media);
    setModalVisible(true);
  };

  const handleSaveMedia = async (mediaData: Partial<Media>) => {
    try {
      if (editingMedia) {
        // Update existing media
        await updateVideo(editingMedia.id, mediaData);
        Alert.alert("Sukses", "Media berhasil diperbarui");
      } else {
        // Add new media
        await addVideo(mediaData);
        Alert.alert("Sukses", "Media berhasil ditambahkan");
      }

      setModalVisible(false);
      loadMedia();
    } catch (error) {
      console.error("Error saat menyimpan media:", error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  const handleDeleteMedia = (media: Media) => {
    Alert.alert(
      "Konfirmasi",
      `Apakah kamu yakin akan menghapus ${
        media.type === "image" ? "gambar" : "video"
      } "${media.title}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVideo(media.id);
              loadMedia();
              Alert.alert("Sukses", "Media berhasil dihapus");
            } catch (error) {
              console.error("Error saat menghapus media:", error);
              Alert.alert("Error", "Gagal menghapus media");
            }
          },
        },
      ]
    );
  };

  // Filter media items based on selected type
  const filteredMedia =
    mediaTypeFilter === "all"
      ? mediaItems
      : mediaItems.filter((item) => item.type === mediaTypeFilter);

  // Filter options
  const filterOptions = [
    { id: "all", label: "Semua" },
    { id: "video", label: "Video" },
    { id: "image", label: "Gambar" },
  ];

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
            <Text className="text-white text-xl font-bold">Kelola Media</Text>
            <Text className="text-blue-100 text-xs mt-1">
              Tambah, edit atau hapus video dan gambar
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View className="flex-1 px-5 pt-4">
        {/* Add Media Button */}
        <AddMediaButton onPress={openAddMediaModal} />
        {/* Filter Tabs - Fixed implementation */}
        <View className="mb-4 bg-white rounded-lg p-2">
          <Text className="text-gray-700 font-medium mb-1">Filter Media:</Text>
          <Picker
            selectedValue={mediaTypeFilter}
            onValueChange={(itemValue) =>
              setMediaTypeFilter(itemValue as "all" | "video" | "image")
            }
          >
            <Picker.Item label="Semua" value="all" />
            <Picker.Item label="Video" value="video" />
            <Picker.Item label="Gambar" value="image" />
          </Picker>
        </View>

        {/* Media List */}
        <Text className="text-lg font-bold text-gray-800 mb-3">
          Media saat ini ({filteredMedia.length})
        </Text>
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#407BFF" />
            <Text className="text-gray-500 mt-4">Memuat media...</Text>
          </View>
        ) : filteredMedia.length > 0 ? (
          <FlatList
            data={filteredMedia}
            renderItem={({ item }) => (
              <MediaItem
                media={item}
                onEdit={openEditMediaModal}
                onDelete={handleDeleteMedia}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          <EmptyState
            title={
              mediaTypeFilter === "all"
                ? "Tidak ada media"
                : mediaTypeFilter === "video"
                ? "Tidak ada video"
                : "Tidak ada gambar"
            }
            message={
              mediaTypeFilter === "all"
                ? "Ketuk 'Tambah Media Baru' untuk memulai"
                : `Ketuk 'Tambah Media Baru' untuk menambahkan ${
                    mediaTypeFilter === "video" ? "video" : "gambar"
                  }`
            }
            icon={
              mediaTypeFilter === "image" ? "image-outline" : "videocam-outline"
            }
          />
        )}
      </View>

      {/* Upload Modal */}
      <UploadModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveMedia}
        editingMedia={editingMedia}
      />
    </View>
  );
}
