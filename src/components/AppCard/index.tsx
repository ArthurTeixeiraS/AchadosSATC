import React from "react";
import { View, ViewProps } from "react-native";

import { styles } from "./styles";

interface AppCardProps extends ViewProps {
  children: React.ReactNode;
}

export function AppCard({ children, style, ...props }: AppCardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}