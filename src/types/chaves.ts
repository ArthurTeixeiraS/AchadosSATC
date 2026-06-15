export interface Chave {
  id: string;               
  codigo: string;         
  descricao: string;       
  localizacao: string;     
  isArquivado: boolean;    
  createdAt: any;         
  updatedAt: any;        
}

export interface CreateChaveDTO {
  codigo: string;
  descricao: string;
  localizacao: string;
}