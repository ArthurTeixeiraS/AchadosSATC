import { StyleSheet } from "react-native";

import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  input: {
    marginBottom: 22,
    fontFamily: typography.fontFamily.regular,
  },
  inputMultiline: {
    minHeight: 120, // Altura mínima confortável para digitar várias linhas
    textAlignVertical: 'top', // Força o texto para o topo no Android
    padding: 10,
  },
  outline: {
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
});