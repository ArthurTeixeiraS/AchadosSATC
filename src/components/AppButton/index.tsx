import React from "react";
import { Button, ButtonProps, ActivityIndicator } from "react-native-paper";
import { styles } from "./styles";

interface AppButtonProps extends ButtonProps {
  loading?: boolean;
}

//Componente padrão de botão para aplicação
export function AppButton({ loading, children, ...props }: AppButtonProps) {
  return (
    <Button
      mode="contained"
      buttonColor="#004732"
      style={styles.button}
      contentStyle={styles.content}
      labelStyle={styles.label}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : children}
    </Button>
  );
}