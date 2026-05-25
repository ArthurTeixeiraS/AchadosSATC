import React, { useState } from "react";
import {
  Platform,
  Pressable,
  View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import Feather from "@expo/vector-icons/Feather";
import { Text } from "react-native-paper";

import { colors } from "../../styles/colors";

import { styles } from "./styles";

type Props = {
  label?: string;
  value: string;
  onChange: (date: string) => void;
};

export function AppDatePicker({
  label,
  value,
  onChange,
}: Props) {
  const [showPicker, setShowPicker] =
    useState(false);

  function formatDate(date: Date) {
    return date.toLocaleDateString("pt-BR");
  }

  function handleChange(_: any, selectedDate?: Date) {
    setShowPicker(false);

    if (selectedDate) {
      onChange(formatDate(selectedDate));
    }
  }

  return (
    <View>
      {!!label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

      <Pressable
        style={styles.input}
        onPress={() => setShowPicker(true)}
      >
        <Text
          style={[
            styles.value,
            !value && styles.placeholder,
          ]}
        >
          {value || "Selecione uma data"}
        </Text>

        <Feather
          name="calendar"
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={
            Platform.OS === "ios"
              ? "spinner"
              : "default"
          }
          onChange={handleChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}