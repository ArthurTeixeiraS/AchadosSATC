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

  Para ferramentas, onde a especificidade é maior, haverá obrigatoriedade no campo "Descrição", esse será um "Nome Completo" da ferramenta,
  o campo "Nome" conterá apenas o nome genérico dela
*/ 
export interface Resource {
  id: string;
  nome: string;
  descricao?: string;  //Maquinas diferem tanto entre si? Precisam de descrição?
  tipo: ResourceType;
  status: ResourceStatus;
  localizacao?: string;  //Localização pras Maquinas OK, pras ferramentas seria em que local da ferramentaria estão?
  quantidadeTotal?: number;
  quantidadeDisponivel?: number; // Vai ser preenchivel no cadastro? Ou vai ser manipulado via demanda?
  laboratorioId?: string;
  patrimonio?: string; //Etiqueta > Validar se isso é realmente necessário

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