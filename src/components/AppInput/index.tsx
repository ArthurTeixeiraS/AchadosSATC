import React from "react";
import { TextInput, TextInputProps } from "react-native-paper";

import { colors } from "../../styles/colors";
import { styles } from "./styles";

interface AppInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

//Componente padrão de input para aplicação
export const AppInput = React.forwardRef<any, AppInputProps>(({ style, multiline, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      mode="outlined"
      multiline={multiline} // 👈 Repasse o multiline para o Paper
      style={[
        styles.input,
        multiline && styles.inputMultiline, // 👈 Se multiline for true, aplica a altura
        style // 👈 Permite que a tela injete estilos extras se necessário
      ]}
      outlineStyle={styles.outline}
      activeOutlineColor={colors.primary}
      outlineColor={colors.border}
      textColor={colors.text}
      placeholderTextColor={colors.textSecondary}
      {...props} // Repassa as demais propriedades (placeholder, value, etc)
    />
  );
});