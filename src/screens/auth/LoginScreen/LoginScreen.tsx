import React from "react";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  View,
} from "react-native";
import { Text, TextInput } from "react-native-paper";

import { useAuth } from "../../../contexts/AuthContext";
import { AppInput } from "../../../components/AppInput";
import { AppButton } from "../../../components/AppButton";

import { styles } from "./styles";

export function LoginScreen() {
  //Captura dos dados e envio para o AuthContext
  const { login } = useAuth();

  const [cracha, setCracha] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleLogin() {
    try {
      setErro("");

      if (!cracha.trim() || !senha.trim()) {
        setErro("Informe o crachá e a senha.");
        return;
      }

      setLoading(true);
      await login(cracha.trim(), senha);
    } catch (error: any) {
      setErro(error.message || "Erro ao realizar login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoTitle}>SATC</Text>
          <Text style={styles.logoSubtitle}>FERRAMENTARIA</Text>
        </View>

        <Text style={styles.label}>Crachá</Text>
        <AppInput
          value={cracha}
          onChangeText={setCracha}
          placeholder="Informe seu número do crachá"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Senha</Text>
        <AppInput
          value={senha}
          onChangeText={setSenha}
          placeholder="Informe sua senha"
          secureTextEntry={!mostrarSenha}
          right={
            <TextInput.Icon
              icon={mostrarSenha ? "eye-off" : "eye"}
              onPress={() => setMostrarSenha(!mostrarSenha)}
            />
          }
        />

        <Text style={styles.forgotText}>Esqueceu sua senha?</Text>

        {!!erro && <Text style={styles.errorText}>{erro}</Text>}

        <AppButton
          loading={loading}
          onPress={handleLogin}
          icon="arrow-right"
        >
          Login
        </AppButton>
      </View>
    </KeyboardAvoidingView>
  );
}