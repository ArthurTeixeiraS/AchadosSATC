export interface Key {
  id: string;               
  codigo: string;         
  descricao: string;       
  localizacao: string;     
  isArquivado: boolean;    
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
