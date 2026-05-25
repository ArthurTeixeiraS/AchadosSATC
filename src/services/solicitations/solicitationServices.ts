import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";
import { AppUser } from "../../types/User";
import { SolicitationDraft } from "../../types/Solicitation";

const COLLECTION_NAME = "solicitacoes";

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