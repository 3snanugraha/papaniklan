import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: string;
}

export default function EmptyState({
  title,
  message,
  icon = "videocam-outline",
}: EmptyStateProps) {
  return (
    <View className="flex-1 justify-center items-center p-8">
      <Ionicons
        name={icon as any}
        size={60}
        color="#d1d5db"
        className="mb-4"
      />
      <Text className="text-gray-400 text-center text-lg font-medium">
        {title}
      </Text>
      <Text className="text-gray-400 text-center mt-2">
        {message}
      </Text>
    </View>
  );
}
