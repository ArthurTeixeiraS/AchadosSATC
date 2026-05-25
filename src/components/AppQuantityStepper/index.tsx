import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import Feather from "@expo/vector-icons/Feather";

import { colors } from "../../styles/colors";
import { styles } from "./styles";

interface AppQuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  onRemove?: () => void;
}

export function AppQuantityStepper({
  value,
  min = 0,
  max,
  onChange,
  onRemove,
}: AppQuantityStepperProps) {
  const canDecrease = value > min;
  const canIncrease = max === undefined || value < max;

  function handleDecrease() {
    if (!canDecrease) {
      return;
    }

    onChange(value - 1);
  }

  function handleIncrease() {
    if (!canIncrease) {
      return;
    }

    onChange(value + 1);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.stepButton,
          !canDecrease && styles.stepButtonDisabled,
        ]}
        disabled={!canDecrease}
        onPress={handleDecrease}
      >
        <Feather
          name="minus"
          size={16}
          color={canDecrease ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>

      <Text style={styles.value}>{value}</Text>

      <TouchableOpacity
        style={[
          styles.stepButton,
          !canIncrease && styles.stepButtonDisabled,
        ]}
        disabled={!canIncrease}
        onPress={handleIncrease}
      >
        <Feather
          name="plus"
          size={16}
          color={canIncrease ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>

      {!!onRemove && (
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Feather name="x" size={18} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}