import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Media } from "../../types";

interface MediaItemProps {
  media: Media;
  onEdit: (media: Media) => void;
  onDelete: (media: Media) => void;
}

export default function MediaItem({ media, onEdit, onDelete }: MediaItemProps) {
  // Determine if this is an image or video
  const isImage = media.type === "image";

  // Format duration display
  const formatDuration = (duration?: number) => {
    if (!duration) return "Unknown duration";

    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center">
      <View className="w-20 h-20 bg-gray-200 rounded-lg mr-4 items-center justify-center overflow-hidden">
        {media.thumbnail ? (
          <Image source={{ uri: media.thumbnail }} className="w-full h-full" />
        ) : (
          <Ionicons
            name={isImage ? "image" : "videocam"}
            size={30}
            color="#407BFF"
          />
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="font-medium text-gray-800" numberOfLines={1}>
            {media.title || "Untitled Media"}
          </Text>
          {isImage && (
            <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-blue-700">Gambar</Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-gray-500 mt-1">
          {isImage ? "Durasi: 8 detik" : formatDuration(media.duration)}
        </Text>
        <Text className="text-xs text-gray-500 mt-1">
          {media.created_at
            ? new Date(media.created_at).toLocaleDateString()
            : "Unknown date"}
        </Text>
      </View>
      <View className="flex-row">
        <TouchableOpacity className="p-2 mr-1" onPress={() => onEdit(media)}>
          <Ionicons name="pencil" size={22} color="#407BFF" />
        </TouchableOpacity>
        <TouchableOpacity className="p-2" onPress={() => onDelete(media)}>
          <Ionicons name="trash-outline" size={22} color="#FF4040" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
