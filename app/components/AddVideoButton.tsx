import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AddVideoButtonProps {
  onPress: () => void;
}

export default function AddVideoButton({ onPress }: AddVideoButtonProps) {
  return (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-5 shadow-sm flex-row items-center border border-blue-100"
      onPress={onPress}
    >
      <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
        <Ionicons name="add" size={24} color="#407BFF" />
      </View>
      <View className="flex-1">
        <Text className="font-medium text-gray-800">Tambah Video Baru</Text>
        <Text className="text-xs text-gray-500 mt-1">
          Unggah video dari perangkat Anda
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#407BFF" />
    </TouchableOpacity>
  );
}
