export type ResourceType = "FERRAMENTA" | "MAQUINA" | "LABORATORIO";

export type ResourceStatus = "DISPONIVEL" | "EM_USO" | "MANUTENCAO";

/*
  Um Recurso poderá ser uma Ferramenta, uma Máquina ou um Laboratório, 
  uma solicitação será povoada de Recursos,

  Como os três tipos possíveis de Recursos possuem atributos diferentes entre si, nem todos serão obrigatórios no objeto de gravação
<<<<<<< Updated upstream
*/ 
=======

  Para ferramentas, onde a especificidade é maior, haverá obrigatoriedade no campo "Descrição", esse será um "Nome Completo" da ferramenta,
  o campo "Nome" conterá apenas o nome genérico dela
*/
>>>>>>> Stashed changes
export interface Resource {
  id: string;
  nome: string;
  descricao?: string;
  tipo: ResourceType;
<<<<<<< Updated upstream
  status: ResourceStatus;
  localizacao?: string;
=======
  status: ResourceStatus; //Fixo na inclusão
  localizacao?: string;  //Localização pras Maquinas OK, pras ferramentas seria em que local da ferramentaria estão?
>>>>>>> Stashed changes
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