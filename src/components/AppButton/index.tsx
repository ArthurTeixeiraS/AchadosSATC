import React from "react";
import { Button, ButtonProps } from "react-native-paper";

import { colors } from "../../styles/colors";
import { styles } from "./styles";

interface AppButtonProps extends ButtonProps {
  loading?: boolean;
}

//Componente padrão de botão para aplicação
export function AppButton({
  loading,
  children,
  style,
  contentStyle,
  labelStyle,
  mode,
  buttonColor,
  textColor,
  disabled,
  ...props
}: AppButtonProps) {
  return (
    <Button
      {...props}
      mode={mode ?? "contained"}
      buttonColor={buttonColor ?? colors.primary}
      textColor={textColor ?? colors.white}
      style={[styles.button, style]}
      contentStyle={[styles.content, contentStyle]}
      labelStyle={[styles.label, labelStyle]}
      loading={loading}
      disabled={loading || disabled}
    >
      {children}
    </Button>
  );
}
