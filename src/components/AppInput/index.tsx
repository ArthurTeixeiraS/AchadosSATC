import React from "react";
import { TextInput, TextInputProps } from "react-native-paper";

import { colors } from "../../styles/colors";
import { styles } from "./styles";

interface AppInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

//Componente padrão de input para aplicação
export function AppInput({ multiline, style, ...props }: AppInputProps) {
  return (
    <TextInput
      mode="outlined"
      multiline={multiline}
      style={[
        styles.input,
        multiline && styles.multilineInput,
        style,
      ]}
      outlineStyle={styles.outline}
      activeOutlineColor={colors.primary}
      outlineColor={colors.border}
      textColor={colors.text}
      placeholderTextColor={colors.textSecondary}
      {...props}
    />
  );
}