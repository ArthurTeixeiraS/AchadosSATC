import React, { useEffect, useRef } from "react";
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
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const repeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didRepeatRef = useRef(false);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  }, [value, onChange]);

  useEffect(() => stopRepeating, []);

  const canDecrease = value > min;
  const canIncrease = max === undefined || value < max;

  function changeBy(step: number) {
    const nextValue = Math.min(
      Math.max(valueRef.current + step, min),
      max ?? Number.POSITIVE_INFINITY
    );

    if (nextValue === valueRef.current) {
      stopRepeating();
      return false;
    }

    valueRef.current = nextValue;
    onChangeRef.current(nextValue);
    return true;
  }

  function stopRepeating() {
    if (repeatTimeoutRef.current) {
      clearTimeout(repeatTimeoutRef.current);
      repeatTimeoutRef.current = null;
    }

    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  }

  function startRepeating(step: number) {
    didRepeatRef.current = false;
    stopRepeating();

    repeatTimeoutRef.current = setTimeout(() => {
      didRepeatRef.current = true;

      if (!changeBy(step)) {
        return;
      }

      repeatIntervalRef.current = setInterval(() => {
        changeBy(step);
      }, 100);
    }, 400);
  }

  function handlePress(step: number) {
    if (!didRepeatRef.current) {
      changeBy(step);
    }

    didRepeatRef.current = false;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.stepButton,
          !canDecrease && styles.stepButtonDisabled,
        ]}
        disabled={!canDecrease}
        onPressIn={() => startRepeating(-1)}
        onPressOut={stopRepeating}
        onPress={() => handlePress(-1)}
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
        onPressIn={() => startRepeating(1)}
        onPressOut={stopRepeating}
        onPress={() => handlePress(1)}
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
