import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type UserRole = 'professor' | 'funcionario';
type Screen = 'login' | 'professor-room' | 'funcionario-room';

const DEFAULT_PASSWORDS: Record<UserRole, string> = {
  professor: 'professor123',
  funcionario: 'funcionario123',
};

export default function App() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('professor');
  const [screen, setScreen] = useState<Screen>('login');
  const [badge, setBadge] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleLogin() {
    if (!badge.trim()) {
      Alert.alert('Cracha obrigatorio', 'Informe o numero do cracha.');
      return;
    }

    if (password !== DEFAULT_PASSWORDS[selectedRole]) {
      Alert.alert(
        'Senha incorreta',
        selectedRole === 'professor'
          ? 'Use a senha padrao de professor.'
          : 'Use a senha padrao de funcionario.',
      );
      return;
    }

    setScreen(
      selectedRole === 'professor' ? 'professor-room' : 'funcionario-room',
    );
  }

  if (screen !== 'login') {
    const isProfessor = screen === 'professor-room';

    return (
      <SafeAreaView style={styles.roomSafeArea}>
        <StatusBar style="light" />
        <View style={styles.room}>
          <Text style={styles.roomTitle}>
            {isProfessor ? 'Sala do Professor' : 'Sala do Funcionario'}
          </Text>
          <Text style={styles.roomSubtitle}>Acesso liberado para o cracha {badge}</Text>
          <Pressable onPress={() => setScreen('login')} style={styles.backButton}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        <View style={styles.logoArea}>
          <View style={styles.logoMark}>
            <View style={styles.logoGearBack} />
            <View style={styles.logoGearFront} />
            <Text style={styles.logoSymbol}>S</Text>
          </View>
          <Text style={styles.logoText}>SATC</Text>
          <Text style={styles.logoSubtext}>FERRAMENTARIA</Text>
        </View>

        <View style={styles.switchContainer}>
          <Pressable
            onPress={() => setSelectedRole('professor')}
            style={[
              styles.switchButton,
              selectedRole === 'professor' && styles.switchButtonActive,
            ]}
          >
            <Text
              style={[
                styles.switchText,
                selectedRole === 'professor' && styles.switchTextActive,
              ]}
            >
              Sou Professor
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedRole('funcionario')}
            style={[
              styles.switchButton,
              selectedRole === 'funcionario' && styles.switchButtonActive,
            ]}
          >
            <Text
              style={[
                styles.switchText,
                selectedRole === 'funcionario' && styles.switchTextActive,
              ]}
            >
              Sou Funcionário
            </Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Crachá</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="number-pad"
            onChangeText={setBadge}
            placeholder="Informe sua número do crachá"
            placeholderTextColor="#A7ADBA"
            style={styles.input}
            value={badge}
          />
        </View>

        <View style={styles.passwordField}>
          <Text style={styles.label}>Senha</Text>
          <View style={styles.passwordBox}>
            <TextInput
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="Informe sua senha"
              placeholderTextColor="#A7ADBA"
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
              value={password}
            />
            <Pressable
              accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onPress={() => setShowPassword((current) => !current)}
              style={styles.eyeButton}
            >
              <View style={styles.eyeShape}>
                <View style={styles.eyeDot} />
              </View>
            </Pressable>
          </View>

          <Pressable>
            <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
          </Pressable>
        </View>

        <Pressable onPress={handleLogin} style={styles.loginButton}>
          <Text style={styles.loginText}>Login</Text>
          <Text style={styles.loginArrow}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const colors = {
  white: '#FFFFFF',
  green: '#003F2B',
  greenMid: '#008566',
  text: '#202938',
  input: '#F0F1F5',
  border: '#E1E4EA',
  placeholder: '#A7ADBA',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 150,
    backgroundColor: colors.white,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoMark: {
    width: 56,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGearBack: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderWidth: 7,
    borderColor: '#4BB64B',
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
  },
  logoGearFront: {
    width: 38,
    height: 38,
    borderWidth: 7,
    borderColor: colors.green,
    borderRadius: 19,
    backgroundColor: colors.white,
  },
  logoSymbol: {
    position: 'absolute',
    color: colors.green,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 30,
  },
  logoText: {
    marginTop: 1,
    color: colors.green,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 20,
  },
  logoSubtext: {
    color: '#26362D',
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 0,
  },
  switchContainer: {
    height: 47,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    marginBottom: 38,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
  },
  switchButton: {
    flex: 1,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  switchButtonActive: {
    backgroundColor: colors.green,
  },
  switchText: {
    color: '#31384A',
    fontSize: 13,
    fontWeight: '700',
  },
  switchTextActive: {
    color: colors.white,
  },
  field: {
    marginBottom: 23,
  },
  passwordField: {
    marginBottom: 39,
  },
  label: {
    marginBottom: 10,
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    height: 48,
    paddingHorizontal: 18,
    backgroundColor: colors.input,
    borderRadius: 13,
    color: colors.text,
    fontSize: 14,
  },
  passwordBox: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderRadius: 13,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingLeft: 18,
    paddingRight: 8,
    color: colors.text,
    fontSize: 14,
  },
  eyeButton: {
    width: 47,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeShape: {
    width: 15,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    borderColor: '#6E7585',
    borderRadius: 8,
  },
  eyeDot: {
    width: 4,
    height: 4,
    backgroundColor: '#6E7585',
    borderRadius: 2,
  },
  forgotText: {
    marginTop: 9,
    color: colors.greenMid,
    fontSize: 12,
    fontWeight: '800',
  },
  loginButton: {
    height: 59,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    borderRadius: 30,
  },
  loginText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  loginArrow: {
    marginLeft: 13,
    color: colors.white,
    fontSize: 27,
    fontWeight: '400',
    lineHeight: 28,
  },
  roomSafeArea: {
    flex: 1,
    backgroundColor: colors.green,
  },
  room: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  roomTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  roomSubtitle: {
    marginTop: 12,
    color: '#DDEDE8',
    fontSize: 14,
    textAlign: 'center',
  },
  backButton: {
    height: 46,
    minWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 23,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
