import React from "react";
import { ActivityIndicator, Button, ButtonProps } from "react-native-paper";

import { colors } from "../../styles/colors";
import { styles } from "./styles";

interface AppButtonProps extends ButtonProps {
  loading?: boolean;
}

//Componente padrão de botão para aplicação
export function AppButton({ loading, children, ...props }: AppButtonProps) {
  return (
    <Button
      mode="contained"
      buttonColor={colors.primary}
      textColor={colors.white}
      style={styles.button}
      contentStyle={styles.content}
      labelStyle={styles.label}
      loading={loading}
      disabled={loading || props.disabled}
      {...props}
    >
      {children}
    </Button>
  );
}