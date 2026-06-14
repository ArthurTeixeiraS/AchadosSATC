import React from "react";
import { ActivityIndicator, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { useFonts } from "expo-font";

import { AuthProvider } from "./src/contexts/AuthContext";
import { NotificationProvider } from "./src/contexts/NotificationContext";
import { AppRoutes } from "./src/routes/AppRoutes";
import { fonts } from "./src/styles/fonts";
import { theme } from "./src/styles/themes";

export default function App() {
  const [fontsLoaded] = useFonts(fonts);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </PaperProvider>
  );
}
