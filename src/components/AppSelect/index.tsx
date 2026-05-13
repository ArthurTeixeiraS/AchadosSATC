import React, { useState } from "react";
import { View } from "react-native";
import { Button, Menu, Text } from "react-native-paper";

import { colors } from "../../styles/colors";
import { styles } from "./styles";

interface SelectOption<T extends string> {
  label: string;
  value: T;
}

interface AppSelectProps<T extends string> {
  label: string;
  value: T;
  options: readonly SelectOption<T>[]; // "readonly" por que o TypeScript transforma o array em readonly
  onChange: (value: T) => void;
}

export function AppSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: AppSelectProps<T>) {
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  function handleSelect(optionValue: T) {
    onChange(optionValue);
    setVisible(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setVisible(true)}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            textColor={colors.text}
            icon="chevron-down"
          >
            {selectedOption?.label ?? "Selecione"}
          </Button>
        }
      >
        {options.map((option) => (
          <Menu.Item
            key={option.value}
            onPress={() => handleSelect(option.value)}
            title={option.label}
          />
        ))}
      </Menu>
    </View>
  );
}