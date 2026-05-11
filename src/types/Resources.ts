export type ResourceType = "FERRAMENTA" | "MAQUINA" | "LABORATORIO";

export type ResourceStatus =
  | "DISPONIVEL"
  | "EM_USO"
  | "MANUTENCAO"
  | "INDISPONIVEL";

export interface Resource {
  id: string;
  nome: string;
  descricao?: string;
  tipo: ResourceType;
  status: ResourceStatus;
  localizacao?: string;
  quantidadeTotal?: number;
  quantidadeDisponivel?: number;
  laboratorioId?: string;
  patrimonio?: string;

  imagemUrl?: string;

  createdAt?: Date;
  updatedAt?: Date;
}