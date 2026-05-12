import React, { useRef } from "react";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Text, TextInput } from "react-native-paper";

import { useAuth } from "../../../contexts/AuthContext";
import { AppInput } from "../../../components/AppInput";
import { AppButton } from "../../../components/AppButton";
import { Image } from "react-native";

import { styles } from "./styles";

export function LoginScreen() {
  //Captura dos dados e envio para o AuthContext
  const { login } = useAuth();

  const [cracha, setCracha] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  //refencias
  const matriculaRef = useRef<any>(null);
  const senhaRef = useRef<any>(null);
  const buttonRef = useRef<any>(null);

  async function handleLogin() {
    try {
      setErro("");

      if (!cracha.trim() || !senha.trim()) {
        setErro("Informe a matrícula e a senha.");
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
          <Image
            source={require("../../../../assets/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.label}>Matrícula</Text>
        <AppInput
          ref={matriculaRef}
          value={cracha}
          onChangeText={setCracha}
          placeholder="Informe seu número da matrícula"
          keyboardType="numeric"
          returnKeyType="next"
          onSubmitEditing={() => senhaRef.current?.focus()}
        />

        <Text style={styles.label}>Senha</Text>
        <AppInput
          ref={senhaRef}
          value={senha}
          onChangeText={setSenha}
          placeholder="Informe sua senha"
          secureTextEntry={!mostrarSenha}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
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