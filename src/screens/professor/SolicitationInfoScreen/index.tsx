import React, { useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import Feather from "@expo/vector-icons/Feather";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppInput } from "../../../components/AppInput";
import { AppButton } from "../../../components/AppButton";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppDatePicker } from "../../../components/AppDatePicker";

import { NovaSolicitacaoStackParamList } from "../../../routes/NovaSolicitacaoStackRoutes";
import { useSolicitationDraft } from "../../../contexts/SolicitationDraftContext";
import { SolicitationShift } from "../../../types/Solicitation";

import { colors } from "../../../styles/colors";
import { styles } from "./styles";
import { AppAlert } from "../../../components/AppAlert";

type Props = NativeStackScreenProps<
  NovaSolicitacaoStackParamList,
  "SolicitationInfo"
>;

const shifts: SolicitationShift[] = ["TARDE", "NOITE"];

function getShiftLabel(shift: SolicitationShift) {
  const labels = {
    TARDE: "Tarde",
    NOITE: "Noite",
  };

  return labels[shift];
}

export function SolicitationInfoScreen({ navigation }: Props) {
  const { draft, setBasicInfo } = useSolicitationDraft();

  const [dataUtilizacao, setDataUtilizacao] = useState(draft.dataUtilizacao);
  const [turno, setTurno] = useState<SolicitationShift>(
    draft.turno || "TARDE"
  );
  const [atividade, setAtividade] = useState(draft.atividade);

  function handleContinue() {
    if (!dataUtilizacao.trim()) {
      Alert.alert("Campo obrigatório", "Informe a data de utilização.");
      return;
    }

    if (!atividade.trim()) {
      Alert.alert("Campo obrigatório", "Informe a atividade a ser desenvolvida.");
      return;
    }

    setBasicInfo({
      dataUtilizacao: dataUtilizacao.trim(),
      turno,
      atividade: atividade.trim(),
    });

    navigation.navigate("SelectMachines");
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Solicitar Recursos</Text>
      </View> */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          <Text style={styles.label}>Data de utilização</Text>

          <AppDatePicker
            value={dataUtilizacao}
            onChange={setDataUtilizacao}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Turno</Text>

          <View style={styles.shiftContainer}>
            {shifts.map((shift) => {
              const isSelected = turno === shift;

              return (
                <TouchableOpacity
                  key={shift}
                  style={[
                    styles.shiftButton,
                    isSelected && styles.shiftButtonActive,
                  ]}
                  onPress={() => setTurno(shift)}
                >
                  <Text
                    style={[
                      styles.shiftText,
                      isSelected && styles.shiftTextActive,
                    ]}
                  >
                    {getShiftLabel(shift)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <AppAlert
          variant="warning"
          title="Lembrete:"
          message="Todo item retirado deve ser devolvido ao final do mesmo turno."
        />

        <View style={styles.card}>
          <Text style={styles.label}>Atividade a ser desenvolvida</Text>

          <AppInput
            value={atividade}
            onChangeText={setAtividade}
            placeholder="Adicione uma descrição sobre a atividade a ser desenvolvida"
            multiline
          />
        </View>

        <View style={styles.buttonContainer}>
          <AppButton onPress={handleContinue}>
            Confirmar e selecionar Máquinas
          </AppButton>

          <AppButton
            mode="outlined"
            buttonColor={colors.white}
            textColor={colors.text}
            onPress={() => navigation.goBack()}
          >
            Cancelar
          </AppButton>
        </View>
      </ScrollView>
    </View>
  );
}