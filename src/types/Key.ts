export interface Key {
  id: string;               
  codigo: string;         
  descricao: string;       
  localizacao: string;     
  isArquivado: boolean;    
  emprestada: boolean;
  movimentacaoAbertaId?: string | null;
  professorAtualId?: string | null;
  professorAtualNome?: string | null;
  professorAtualCracha?: string | null;
  retiradaEm?: any;
  retiradaPorId?: string | null;
  retiradaPorNome?: string | null;
  createdAt: any;         
  updatedAt: any;        
}

export interface CreateKeyDTO {
  codigo: string;
  descricao: string;
  localizacao: string;
}

export interface UpdateKeyDTO {
  descricao: string;
  localizacao: string;
}

export type KeyMovementStatus = "EM_ABERTO" | "DEVOLVIDA";

export interface KeyMovementActor {
  id: string;
  nome: string;
  cracha?: string | null;
}

export interface KeyMovement {
  id: string;
  tipo: "CHAVE";
  chaveId: string;
  chaveCodigo: string;
  chaveLocalizacao: string;
  professor: KeyMovementActor;
  retiradaPor: KeyMovementActor;
  retiradaEm: any;
  devolvidaPor?: KeyMovementActor | null;
  devolvidaEm?: any;
  status: KeyMovementStatus;
  createdAt: any;
  updatedAt: any;
}
