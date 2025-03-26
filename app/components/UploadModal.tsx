import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Media } from "../../types";

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (mediaData: Partial<Media>) => Promise<void>;
  editingMedia: Media | null;
}

export default function UploadModal({
  visible,
  onClose,
  onSave,
  editingMedia,
}: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [uri, setUri] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [isImage, setIsImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal is opened with new data
  useEffect(() => {
    if (visible) {
      if (editingMedia) {
        setTitle(editingMedia.title || "");
        setUri(editingMedia.uri || "");
        setThumbnail(editingMedia.thumbnail || "");
        setIsImage(editingMedia.type === "image");
      } else {
        setTitle("");
        setUri("");
        setThumbnail("");
        setIsImage(false);
      }
    }
  }, [visible, editingMedia]);

  const pickMedia = async () => {
    try {
      if (isImage) {
        // Pick an image
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"], // Gunakan array string alih-alih MediaTypeOptions
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setUri(asset.uri);
          setThumbnail(asset.uri); // Use the image itself as thumbnail

          // Create automatic title from filename if empty
          if (!title) {
            const filename = asset.fileName || "Gambar";
            setTitle(filename.split(".")[0]);
          }
        }
      } else {
        // Pick a video
        const result = await DocumentPicker.getDocumentAsync({
          type: "video/*",
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setUri(asset.uri);

          // Create automatic title from filename if empty
          if (!title) {
            const filename = asset.name || "Video";
            setTitle(filename.split(".")[0]);
          }
        }
      }
    } catch (error) {
      console.error("Kesalahan memilih media:", error);
      Alert.alert("Kesalahan", "Gagal memilih media");
    }
  };

  const pickThumbnail = async () => {
    // Only needed for videos
    if (isImage) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], // Gunakan array string alih-alih MediaTypeOptions
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setThumbnail(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Kesalahan memilih thumbnail:", error);
      Alert.alert("Kesalahan", "Gagal memilih thumbnail");
    }
  };

  const handleSaveMedia = async () => {
    if (!uri) {
      Alert.alert(
        "Kesalahan",
        isImage ? "Silakan pilih gambar" : "Silakan pilih video"
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert("Kesalahan", "Silakan masukkan judul");
      return;
    }

    setIsSubmitting(true);

    try {
      const mediaData: Partial<Media> = {
        title: title,
        uri: uri,
        type: isImage ? "image" : "video",
        thumbnail: thumbnail,
        duration: isImage ? 8 : undefined, // 8 seconds for images
        created_at: Date.now(),
      };

      await onSave(mediaData);
    } catch (error) {
      console.error("Kesalahan menyimpan media:", error);
      Alert.alert("Kesalahan", "Gagal menyimpan media");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-5 h-[80%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-gray-800">
              {editingMedia ? "Edit Media" : "Tambah Media Baru"}
            </Text>
            <TouchableOpacity className="p-2" onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Media Type Selector */}
            <View className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">
                Jenis Media
              </Text>
              <View className="flex-row items-center justify-between bg-gray-100 p-3 rounded-lg">
                <Text className="text-gray-800">
                  {isImage ? "Gambar (tampil 8 detik)" : "Video"}
                </Text>
                <View className="flex-row items-center">
                  <Text className="mr-2 text-gray-600">Video</Text>
                  <Switch
                    value={isImage}
                    onValueChange={setIsImage}
                    trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
                    thumbColor={isImage ? "#407BFF" : "#f4f4f5"}
                  />
                  <Text className="ml-2 text-gray-600">Gambar</Text>
                </View>
              </View>
            </View>

            {/* Title */}
            <View className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">Judul</Text>
              <TextInput
                className="bg-gray-100 p-3 rounded-lg text-gray-800"
                placeholder="Masukkan judul media"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Media Selection */}
            <View className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">
                Pilih {isImage ? "Gambar" : "Video"}
              </Text>
              <TouchableOpacity
                className="bg-gray-100 p-4 rounded-lg flex-row items-center justify-between"
                onPress={pickMedia}
              >
                <Text className="text-gray-600">
                  {uri
                    ? "Media terpilih"
                    : `Ketuk untuk memilih file ${
                        isImage ? "gambar" : "video"
                      }`}
                </Text>
                <Ionicons name="cloud-upload" size={24} color="#407BFF" />
              </TouchableOpacity>
              {uri ? (
                <Text className="text-xs text-green-600 mt-2">
                  ✓ File {isImage ? "gambar" : "video"} terpilih
                </Text>
              ) : null}
            </View>

            {/* Thumbnail (only for videos) */}
            {!isImage && (
              <View className="mb-8">
                <Text className="text-gray-700 font-medium mb-2">
                  Thumbnail (Opsional)
                </Text>
                <TouchableOpacity
                  className="bg-gray-100 rounded-lg overflow-hidden h-40 items-center justify-center"
                  onPress={pickThumbnail}
                >
                  {thumbnail ? (
                    <Image
                      source={{ uri: thumbnail }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="items-center">
                      <Ionicons name="image" size={40} color="#9ca3af" />
                      <Text className="text-gray-500 mt-2">
                        Ketuk untuk memilih thumbnail
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              className="bg-[#407BFF] p-4 rounded-xl items-center mb-6"
              onPress={handleSaveMedia}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  {editingMedia ? "Perbarui Media" : "Simpan Media"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
