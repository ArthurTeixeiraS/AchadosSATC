import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import Feather from "@expo/vector-icons/Feather";

import { colors } from "../../styles/colors";

import { styles } from "./styles";

type AlertVariant =
  | "warning"
  | "error"
  | "success"
  | "info";

type Props = {
  title?: string;
  message: string;
  variant?: AlertVariant;
};

export function AppAlert({
  title,
  message,
  variant = "warning",
}: Props) {
  const variants = {
    warning: {
      icon: "alert-triangle",
      borderColor: "#FACC15",
      backgroundColor: "#FFF8E1",
      textColor: "#7C2D12",
    },

    error: {
      icon: "x-circle",
      borderColor: colors.error,
      backgroundColor: "#FEF2F2",
      textColor: colors.error,
    },

    success: {
      icon: "check-circle",
      borderColor: "#22C55E",
      backgroundColor: "#F0FDF4",
      textColor: "#166534",
    },

    info: {
      icon: "info",
      borderColor: colors.primary,
      backgroundColor: "#EFF6FF",
      textColor: colors.primary,
    },
  };

  const currentVariant = variants[variant];

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: currentVariant.borderColor,
          backgroundColor: currentVariant.backgroundColor,
        },
      ]}
    >
      <Feather
        name={currentVariant.icon as any}
        size={18}
        color={currentVariant.textColor}
      />

      <Text
        style={[
          styles.message,
          {
            color: currentVariant.textColor,
          },
        ]}
      >
        {!!title && (
          <Text style={styles.title}>
            {title}{" "}
          </Text>
        )}

        {message}
      </Text>
    </View>
  );
}