# Ferramentaria SATC - Sistema de Gestão da Ferramentaria

# Cliente

| Campo | Informação |
|--------|------------|
| **Empresa** | Associação Beneficente da Indústria Carbonífera de Santa Catarina (SATC) |
| **CNPJ** | 83.649.830/0001-71 |
| **Endereço** | Rua Pascoal Meller, 73 - Universitário, Criciúma/SC |

---

## Relato do Problema

Atualmente, parte dos processos da Ferramentaria da SATC é realizada manualmente por meio de fichas físicas e registros por e-mail. Esse fluxo inclui solicitações de ferramentas, máquinas e laboratórios, controle de retirada e devolução de recursos e chaves, além do registro de ocorrências relacionadas à manutenção.

Esse modelo dificulta a centralização das informações, reduz a rastreabilidade dos recursos utilizados e torna a consulta de históricos mais lenta. Também aumenta o risco de inconsistências, perda de registros e conflitos de disponibilidade, exigindo que funcionários e professores dependam de verificações manuais para acompanhar solicitações, reservas e devoluções.

Como solução, propõe-se uma aplicação mobile para digitalizar os processos operacionais da Ferramentaria. O sistema centraliza solicitações, aprovações, retiradas, devoluções, controle de chaves e ocorrências, oferecendo maior organização, segurança e agilidade para professores e funcionários.

---

## 📱 Sobre o Projeto

O **Ferramentaria SATC** é uma aplicação mobile voltada ao gerenciamento dos recursos utilizados em atividades acadêmicas e práticas da instituição. A solução permite administrar ferramentas, máquinas e laboratórios, acompanhar a disponibilidade dos itens e registrar todo o ciclo de uma solicitação.

O projeto atende dois perfis principais:

1. **Funcionário (Administrador):** gerencia recursos, analisa solicitações e registra retiradas, devoluções e movimentações da ferramentaria.
2. **Professor:** solicita recursos para atividades acadêmicas e acompanha o andamento e o histórico de seus pedidos.

O objetivo é substituir processos manuais por um fluxo digital rastreável, reduzindo o uso de fichas físicas e facilitando o acesso às informações.

---

## ⚙️ Funcionalidades Principais

### 👨‍🏭 Funcionário (Administrador)

- Cadastrar, editar e remover ferramentas, máquinas e laboratórios;
- Consultar disponibilidade e controlar o estoque de ferramentas;
- Analisar, aprovar ou recusar solicitações;
- Identificar solicitações imediatas e conflitos de data e turno;
- Registrar a retirada e a devolução dos recursos;
- Acompanhar solicitações em andamento, atrasos e histórico;
- Controlar chaves e acompanhar ocorrências de manutenção.

### 👨‍🏫 Professor

- Consultar ferramentas, máquinas e laboratórios disponíveis;
- Criar solicitações normais ou imediatas;
- Selecionar recursos conforme a atividade, data e turno;
- Acompanhar status, recursos reservados e histórico;
- Cancelar solicitações que ainda não foram utilizadas;
- Registrar ocorrências relacionadas aos recursos;
- Receber notificações sobre solicitações e mudanças de status.

---

## 🔄 Fluxo e Regras Essenciais

O fluxo principal começa com a solicitação de recursos pelo professor. O funcionário analisa o pedido e pode aprová-lo ou recusá-lo. Após a aprovação, a retirada e a devolução são registradas até o encerramento da solicitação.

- Solicitações devem ser feitas preferencialmente com **48 horas de antecedência**;
- Pedidos fora desse prazo são classificados como **imediatos**;
- Toda solicitação precisa ser analisada por um funcionário;
- Máquinas e recursos não podem ser aprovados para solicitações conflitantes na mesma data e turno;
- Cada solicitação, aprovação, retirada, devolução, alteração ou ocorrência deve registrar o usuário responsável e a data da ação.

---

## 🚧 Status do Projeto

O núcleo da aplicação já contempla autenticação e separação por perfil, cadastro e gerenciamento de recursos, criação e acompanhamento de solicitações, classificação de pedidos imediatos, aprovação ou recusa, cancelamento, registro de retirada e devolução e consulta ao histórico.

Os módulos de **controle de chaves**, **ocorrências de manutenção**, **notificações** e **alterações parciais em solicitações aprovadas** estão previstos na documentação e permanecem em evolução.

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** [React Native](https://reactnative.dev/) com [Expo](https://expo.dev/)
- **Linguagem:** TypeScript
- **Backend e banco de dados:** [Firebase](https://firebase.google.com/) e Cloud Firestore
- **Autenticação:** Firebase Authentication
- **Navegação:** [React Navigation](https://reactnavigation.org/)
- **Interface:** [React Native Paper](https://callstack.github.io/react-native-paper/)

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) e npm instalados;
- Expo Go ou um emulador Android configurado;
- Credenciais do Firebase definidas no arquivo de ambiente do projeto.

### Instalação

```bash
git clone https://github.com/ArthurTeixeiraS/FerramentariaSATC.git
cd FerramentariaSATC
npm install
npm start
```

Após iniciar o Expo, utilize o QR Code no Expo Go ou selecione a opção para abrir o aplicativo em um emulador.
