import type { Timestamp } from "firebase/firestore";

export type NotificationType =
  | "NOVA_SOLICITACAO"
  | "SOLICITACAO_APROVADA"
  | "SOLICITACAO_RECUSADA"
  | "ALTERACAO_PENDENTE"
  | "ALTERACAO_ITEM_APROVADO"
  | "ALTERACAO_ITEM_RECUSADO"
  | "RETIRADA_REGISTRADA"
  | "DEVOLUCAO_PARCIAL"
  | "DEVOLUCAO_INTEGRAL"
  | "SOLICITACAO_CANCELADA"
  | "SOLICITACAO_ATRASADA";

export interface AppNotification {
  id: string;
  tipo: NotificationType;
  destinatarioId: string;
  solicitacaoId: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadaEm: Timestamp | null;
  lidaEm?: Timestamp | null;
}
