export type ResourceType = "FERRAMENTA" | "MAQUINA" | "LABORATORIO";

export type ResourceStatus =
  | "DISPONIVEL"
  | "EM_USO"
  | "MANUTENCAO"
  | "INDISPONIVEL";

/*
  Um Recurso poderá ser uma Ferramenta, uma Máquina ou um Laboratório, 
  uma solicitação será povoada de Recursos,

  Como os três tipos possíveis de Recursos possuem atributos diferentes entre si, nem todos serão obrigatórios no objeto de gravação
*/ 
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

export interface CreateResourceDTO {
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
}