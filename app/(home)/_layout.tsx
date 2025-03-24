import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function HomeLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#f9fafb" },
          animation: "slide_from_right",
        }}
      />
    </>
  );
}
