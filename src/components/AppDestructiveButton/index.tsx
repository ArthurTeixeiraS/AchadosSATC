import React from "react";
import { ButtonProps } from "react-native-paper";

import { AppButton } from "../AppButton";
import { colors } from "../../styles/colors";
import { styles } from "./styles";

export function AppDestructiveButton({
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <AppButton
      {...props}
      mode="outlined"
      buttonColor={colors.white}
      textColor={colors.error}
      style={[styles.button, style]}
    >
      {children}
    </AppButton>
  );
}
