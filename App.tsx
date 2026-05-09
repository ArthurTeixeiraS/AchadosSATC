import React from "react";
import { PaperProvider } from "react-native-paper";

import { AuthProvider } from "./src/contexts/AuthContext";
import { AppRoutes } from "./src/routes/AppRoutes";

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </PaperProvider>
  );
}