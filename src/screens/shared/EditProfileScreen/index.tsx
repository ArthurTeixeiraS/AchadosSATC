import React, { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppInput } from "../../../components/AppInput";
import { AppButton } from "../../../components/AppButton";

import { useAuth } from "../../../contexts/AuthContext";
import { updateUserProfile } from "../../../services/user/userServices";

import { styles } from "./styles";

type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
};

type Props = NativeStackScreenProps<ProfileStackParamList, "EditProfile">;

export function EditProfileScreen({ navigation }: Props) {
  const { appUser, reloadUser } = useAuth();

  const [email, setEmail] = useState(appUser?.emailInstitucional ?? "");
  const [telefone, setTelefone] = useState(appUser?.telefone ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSalvar() {
    if (!email.trim()) {
      Alert.alert("Atenção", "O e-mail não pode estar vazio.");
      return;
    }

    try {
      setLoading(true);

      await updateUserProfile(appUser!.id, {
        emailInstitucional: email.trim(),
        telefone: telefone.trim() || null,
      });

      await reloadUser();

      Alert.alert("Sucesso", "Dados atualizados com sucesso!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.log("Erro ao atualizar perfil:", error);
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Matrícula</Text>
        <AppInput
          value={appUser?.cracha ?? ""}
          onChangeText={() => {}}
          editable={false}
        />

        <Text style={styles.label}>E-mail institucional</Text>
        <AppInput
          value={email}
          onChangeText={setEmail}
          placeholder="seu@satc.edu.br"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Telefone</Text>
        <AppInput
          value={telefone}
          onChangeText={setTelefone}
          placeholder="(48) 99999-9999"
          keyboardType="phone-pad"
        />

        <View style={styles.buttonWrapper}>
          <AppButton loading={loading} onPress={handleSalvar}>
            Salvar alterações
          </AppButton>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
