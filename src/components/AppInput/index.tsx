import React from "react";
import { TextInput, TextInputProps } from "react-native-paper";
import { styles } from "./styles";

interface AppInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

//Componente padrão de input para aplicação
export function AppInput(props: AppInputProps) {
  return (
    <TextInput
      mode="outlined"
      style={styles.input}
      outlineStyle={styles.outline}
      activeOutlineColor="#004732"
      outlineColor="#F0F0F0"
      {...props}
    />
  );
}