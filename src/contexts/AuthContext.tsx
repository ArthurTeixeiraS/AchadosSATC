import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "@firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "../services/firebase/firebaseConfig";
import { AppUser } from "../types/User";

interface AuthContextData {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  login: (cracha: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null); 
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function clearAuthenticatedSession() {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Erro ao limpar sessão autenticada:", error);
    }

    setFirebaseUser(null);
    setAppUser(null);
  }

  async function loadUserData(uid: string) {
    //Busca os dados do usuário no Firestore via UID
    const userRef = doc(db, "usuarios", uid);
    const userSnap = await getDoc(userRef); 

    if (!userSnap.exists()) {
      throw new Error("Usuário não encontrado no Firestore.");
    }

    const data = userSnap.data() as Omit<AppUser, "id">;

    if (data.statusConta !== "ATIVO") {
      throw new Error("Usuário inativo. Entre em contato com a ferramentaria.");
    }

    setAppUser({
      id: uid,
      ...data,
    });
  }

  async function findEmailByCracha(cracha: string) {
    //Essa função permite o login via crachá, buscando o e-mail institucional associado no Firestore
    const usuariosRef = collection(db, "usuarios");
    const q = query(usuariosRef, where("cracha", "==", cracha));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error("Crachá não encontrado.");
    }

    const userDoc = snapshot.docs[0];
    const data = userDoc.data();

    if (!data.emailInstitucional) {
      throw new Error("E-mail institucional não cadastrado para este crachá.");
    }

    return data.emailInstitucional as string;
  }

  async function login(cracha: string, senha: string) {
    let authenticated = false;

    try {
      const email = await findEmailByCracha(cracha);
      const credential = await signInWithEmailAndPassword(auth, email, senha);
      authenticated = true;

      setFirebaseUser(credential.user);
      await loadUserData(credential.user.uid);
    } catch (error: any) {
      if (authenticated) {
        await clearAuthenticatedSession();
      }

      // trata erros do firebase e do proprio app com mensagem amigavel
      const code = error?.code ?? "";

      if (
        code === "auth/wrong-password" ||
        code === "auth/invalid-password" ||
        code === "auth/invalid-credential" ||
        error?.message === "Crachá não encontrado."
      ) {
        throw new Error("Sua matrícula ou senha estão incorretos.");
      }

      if (code === "auth/too-many-requests") {
        throw new Error("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      }

      if (code === "auth/network-request-failed") {
        throw new Error("Sem conexão com a internet. Verifique sua rede e tente novamente.");
      }

      // re-lança outros erros que ja tem mensagem tratada (ex: usuario inativo)
      throw error;
    }
  }

  async function logout() {
    await signOut(auth);
    setFirebaseUser(null);
    setAppUser(null);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setFirebaseUser(user);

        if (user) {
          await loadUserData(user.uid);
        } else {
          setAppUser(null);
        }
      } catch (error) {
        console.log("Erro ao carregar usuário:", error);
        await clearAuthenticatedSession();
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  async function reloadUser() {
    if (firebaseUser) {
      await loadUserData(firebaseUser.uid);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        appUser,
        loading,
        login,
        logout,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
