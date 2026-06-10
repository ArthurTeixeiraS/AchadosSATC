import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  updateDoc,
  doc,
  getDoc
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";
import { AppUser } from "../../types/User";
import { SolicitationDraft } from "../../types/Solicitation";

const COLLECTION_NAME = "solicitacoes";

function parseBrazilianDate(date: string): Date {
  const [day, month, year] = date.split("/").map(Number);

  return new Date(year, month - 1, day, 23, 59, 59);
}

function calculateSolicitationPriority(dataUtilizacao: string) {
  const now = new Date();
  const useDate = parseBrazilianDate(dataUtilizacao);

  const diffInMs = useDate.getTime() - now.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  return diffInHours < 48 ? "IMEDIATA" : "NORMAL";
}

export async function createSolicitation(
  draft: SolicitationDraft,
  professor: AppUser
): Promise<string> {
  const solicitacoesRef = collection(db, COLLECTION_NAME);

  const laboratoriosIds = [
    ...new Set(
      draft.maquinasSelecionadas
        .map((item) => item.resource.laboratorioId)
        .filter(Boolean)
    ),
  ];

  const maquinas = draft.maquinasSelecionadas.map((item) => ({
    recursoId: item.resource.id,
    nome: item.resource.nome,
    laboratorioId: item.resource.laboratorioId ?? null,
  }));

  const ferramentas = draft.ferramentasSelecionadas.map((item) => ({
    recursoId: item.resource.id,
    nome: item.resource.nome,
    quantidade: item.quantidade,
  }));

  const docRef = await addDoc(solicitacoesRef, {
    professorId: professor.id,
    professorNome: professor.nomeCompleto,
    professorCracha: professor.cracha,
    status: "PENDENTE",
    prioridade: calculateSolicitationPriority(draft.dataUtilizacao),
    dataUtilizacao: draft.dataUtilizacao,
    turno: draft.turno,
    atividade: draft.atividade,
    observacoes: draft.observacoes,
    laboratoriosIds,
    maquinas,
    ferramentas,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getDashboardStats() {
  const solicitacoesRef = collection(db, COLLECTION_NAME);

  const hoje = new Date();
  const inicioDaSemana = new Date(hoje);
  inicioDaSemana.setDate(hoje.getDate() - hoje.getDay());
  inicioDaSemana.setHours(0, 0, 0, 0);

  const fimDaSemana = new Date(inicioDaSemana);
  fimDaSemana.setDate(inicioDaSemana.getDate() + 6);
  fimDaSemana.setHours(23, 59, 59, 999);

  const snapshot = await getDocs(solicitacoesRef);

  const solicitacoesDaSemana = snapshot.docs.filter((doc) => {
    const data = doc.data();
    if (!data.createdAt) return false;
    const createdAt = data.createdAt.toDate();
    return createdAt >= inicioDaSemana && createdAt <= fimDaSemana;
  });

  const pendentes = solicitacoesDaSemana.filter(
    (doc) => doc.data().status === "PENDENTE"
  ).length;

  const novas = solicitacoesDaSemana.filter(
    (doc) => !doc.data().status
  ).length;

  const encerradas = solicitacoesDaSemana.filter(
    (doc) => doc.data().status === "ENCERRADA"
  ).length;

  return { pendentes, novas, encerradas };
}

export async function listSolicitations() {
  const solicitacoesRef = collection(db, COLLECTION_NAME);

  const snapshot = await getDocs(solicitacoesRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function cancelSolicitation(id: string): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);

  await updateDoc(solicitationRef, {
    status: "CANCELADA",
    canceladaEm: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function listSolicitationsByProfessor(professorId: string) {
  const solicitacoesRef = collection(db, COLLECTION_NAME);

  const q = query(
    solicitacoesRef,
    where("professorId", "==", professorId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function getSolicitationById(id: string) {
  const solicitationRef = doc(db, COLLECTION_NAME, id);

  const snapshot = await getDoc(solicitationRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function approveSolicitation(
  id: string,
  funcionarioId: string,
  funcionarioNome: string
): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);

  await updateDoc(solicitationRef, {
    status: "APROVADA",
    aprovadaEm: serverTimestamp(),
    aprovadaPorId: funcionarioId,
    aprovadaPorNome: funcionarioNome,
    updatedAt: serverTimestamp(),
  });
}

export async function rejectSolicitation(
  id: string,
  funcionarioId: string,
  funcionarioNome: string,
  motivo: string
): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);

  await updateDoc(solicitationRef, {
    status: "RECUSADA",
    motivoRecusa: motivo,
    recusadaEm: serverTimestamp(),
    recusadaPorId: funcionarioId,
    recusadaPorNome: funcionarioNome,
    updatedAt: serverTimestamp(),
  });
}

export async function registerSolicitationWithdrawal(
  id: string,
  funcionarioId: string,
  funcionarioNome: string
): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);

  await updateDoc(solicitationRef, {
    status: "EM_USO",
    retiradaEm: serverTimestamp(),
    retiradaPorId: funcionarioId,
    retiradaPorNome: funcionarioNome,
    updatedAt: serverTimestamp(),
  });
}

export async function registerSolicitationReturn(
  id: string,
  funcionarioId: string,
  funcionarioNome: string
): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);

  await updateDoc(solicitationRef, {
    status: "ENCERRADA",
    devolvidaEm: serverTimestamp(),
    devolvidaPorId: funcionarioId,
    devolvidaPorNome: funcionarioNome,
    updatedAt: serverTimestamp(),
  });
}