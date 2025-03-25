import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "../../types";

interface VideoItemProps {
  video: Video;
  onEdit: (video: Video) => void;
  onDelete: (video: Video) => void;
}

export default function VideoItem({ video, onEdit, onDelete }: VideoItemProps) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center">
      <View className="w-20 h-20 bg-gray-200 rounded-lg mr-4 items-center justify-center overflow-hidden">
        {video.thumbnail ? (
          <Image source={{ uri: video.thumbnail }} className="w-full h-full" />
        ) : (
          <Ionicons name="videocam" size={30} color="#407BFF" />
        )}
      </View>
      <View className="flex-1">
        <Text className="font-medium text-gray-800" numberOfLines={1}>
          {video.title || "Untitled Video"}
        </Text>
        <Text className="text-xs text-gray-500 mt-1">
          {video.duration
            ? `${Math.floor(video.duration / 60)}:${(video.duration % 60)
                .toString()
                .padStart(2, "0")}`
            : "Unknown duration"}
        </Text>
        <Text className="text-xs text-gray-500 mt-1">
          {video.created_at
            ? new Date(video.created_at).toLocaleDateString()
            : "Unknown date"}
        </Text>
      </View>
      <View className="flex-row">
        <TouchableOpacity className="p-2 mr-1" onPress={() => onEdit(video)}>
          <Ionicons name="pencil" size={22} color="#407BFF" />
        </TouchableOpacity>
        <TouchableOpacity className="p-2" onPress={() => onDelete(video)}>
          <Ionicons name="trash-outline" size={22} color="#FF4040" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
