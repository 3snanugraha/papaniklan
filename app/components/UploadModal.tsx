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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Video } from "../../types";

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (videoData: Partial<Video>) => Promise<void>;
  editingVideo: Video | null;
}

export default function UploadModal({
  visible,
  onClose,
  onSave,
  editingVideo,
}: UploadModalProps) {
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUri, setVideoUri] = useState("");
  const [videoThumbnail, setVideoThumbnail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (visible) {
      if (editingVideo) {
        setVideoTitle(editingVideo.title || "");
        setVideoUri(editingVideo.uri || "");
        setVideoThumbnail(editingVideo.thumbnail || "");
      } else {
        setVideoTitle("");
        setVideoUri("");
        setVideoThumbnail("");
      }
    }
  }, [visible, editingVideo]);

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setVideoUri(asset.uri);
        // Auto-generate title from filename if empty
        if (!videoTitle) {
          const filename = asset.name || "Untitled Video";
          setVideoTitle(filename.split(".")[0]);
        }
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Error", "Failed to select video");
    }
  };

  const pickThumbnail = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVideoThumbnail(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking thumbnail:", error);
      Alert.alert("Error", "Failed to select thumbnail");
    }
  };

  const handleSaveVideo = async () => {
    if (!videoUri) {
      Alert.alert("Error", "Please select a video");
      return;
    }

    if (!videoTitle.trim()) {
      Alert.alert("Error", "Please enter a title for the video");
      return;
    }

    setIsSubmitting(true);

    try {
      const videoData = {
        title: videoTitle,
        uri: videoUri,
        thumbnail: videoThumbnail,
        created_at: Date.now(),
      };

      await onSave(videoData);
    } catch (error) {
      console.error("Error saving video:", error);
      Alert.alert("Error", "Failed to save video");
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
              {editingVideo ? "Edit Video" : "Add New Video"}
            </Text>
            <TouchableOpacity className="p-2" onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Video Title */}
            <View className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">
                Video Title
              </Text>
              <TextInput
                className="bg-gray-100 p-3 rounded-lg text-gray-800"
                placeholder="Enter video title"
                value={videoTitle}
                onChangeText={setVideoTitle}
              />
            </View>

            {/* Video Selection */}
            <View className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">
                Select Video
              </Text>
              <TouchableOpacity
                className="bg-gray-100 p-4 rounded-lg flex-row items-center justify-between"
                onPress={pickVideo}
              >
                <Text className="text-gray-600">
                  {videoUri ? "Video selected" : "Tap to select a video file"}
                </Text>
                <Ionicons name="cloud-upload" size={24} color="#407BFF" />
              </TouchableOpacity>
              {videoUri ? (
                <Text className="text-xs text-green-600 mt-2">
                  ✓ Video file selected
                </Text>
              ) : null}
            </View>

            {/* Thumbnail Selection */}
            <View className="mb-8">
              <Text className="text-gray-700 font-medium mb-2">
                Thumbnail (Optional)
              </Text>
              <TouchableOpacity
                className="bg-gray-100 rounded-lg overflow-hidden h-40 items-center justify-center"
                onPress={pickThumbnail}
              >
                {videoThumbnail ? (
                  <Image
                    source={{ uri: videoThumbnail }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="items-center">
                    <Ionicons name="image" size={40} color="#9ca3af" />
                    <Text className="text-gray-500 mt-2">
                      Tap to select thumbnail
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            {/* Save Button */}
            <TouchableOpacity
              className="bg-[#407BFF] p-4 rounded-xl items-center mb-6"
              onPress={handleSaveVideo}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  {editingVideo ? "Update Video" : "Save Video"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
