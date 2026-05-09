# Ferramentaria SATC - Gestão de Empréstimos de Ferramentas

## 📱 Sobre o Projeto

O **Ferramentaria SATC** é uma aplicação mobile desenvolvida para digitalizar e organizar o processo de empréstimo de ferramentas da Ferramentaria da SATC. O sistema tem como objetivo substituir os registros manuais atualmente realizados em papel, proporcionando maior controle, rastreabilidade e agilidade no gerenciamento dos empréstimos.

A aplicação atende dois perfis principais:

1. **Funcionário (Administrador):**
   Responsável pelo gerenciamento da ferramentaria, controle de empréstimos, devoluções e estoque básico.

2. **Professor:**
   Responsável pela solicitação e acompanhamento dos empréstimos realizados.

---

## 🎯 Objetivo do Sistema

O sistema foi desenvolvido para:

- Centralizar os registros de empréstimos em ambiente digital;
- Facilitar o controle de ferramentas emprestadas;
- Melhorar o acompanhamento de devoluções e atrasos;
- Permitir consultas rápidas sobre disponibilidade de ferramentas;
- Disponibilizar histórico de empréstimos;
- Reduzir o uso de registros físicos e processos manuais.

---

## ⚙️ Funcionalidades Principais

### 👨‍🏭 Funcionário (Administrador)
- Login no sistema;
- Cadastro de ferramentas;
- Edição e remoção de ferramentas;
- Controle básico de estoque;
- Aprovação ou recusa de solicitações;
- Registro de retirada;
- Registro de devolução;
- Visualização de empréstimos em andamento;
- Controle de itens em atraso;
- Consulta ao histórico geral.

### 👨‍🏫 Professor
- Login no sistema;
- Visualização de ferramentas disponíveis;
- Solicitação de empréstimos;
- Consulta de status das solicitações;
- Histórico de empréstimos;
- Recebimento de notificações relacionadas aos prazos de devolução.

---

## 🔄 Fluxo do Sistema

O fluxo principal do sistema ocorre da seguinte forma:

1. Professor acessa o aplicativo;
2. Visualiza ferramentas disponíveis;
3. Solicita empréstimo;
4. Funcionário analisa a solicitação;
5. Solicitação é aprovada ou recusada;
6. Ferramenta é retirada;
7. Sistema acompanha prazo de devolução;
8. Funcionário registra devolução;
9. Empréstimo é encerrado.

O sistema também realiza:
- controle de atrasos;
- atualização automática de status;
- notificações de devolução;
- rastreamento de empréstimos ativos.

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** [React Native](https://reactnative.dev/) com [Expo](https://expo.dev/)
- **Linguagem:** TypeScript
- **Backend:** [Firebase](https://firebase.google.com/)
- **Banco de Dados:** Cloud Firestore
- **Autenticação:** Firebase Authentication
- **Navegação:** [React Navigation](https://reactnavigation.org/)
- **UI:** [React Native Paper](https://callstack.github.io/react-native-paper/)

---

## 🔐 Segurança e Controle

O sistema implementa:
- autenticação de usuários;
- controle de permissões por perfil;
- persistência em nuvem;
- controle de status dos empréstimos;
- rastreabilidade das movimentações realizadas;
- histórico de empréstimos e devoluções.

---

## 📦 Estrutura Básica do Sistema

### Entidades principais

#### Usuário
- Funcionário
- Professor

#### Ferramenta
- Nome
- Categoria
- Quantidade
- Estado
- Disponibilidade

#### Solicitação de Empréstimo
- Datas
- Status
- Usuário responsável
- Ferramenta solicitada

#### Notificação
- Alertas de prazo;
- Aprovação;
- Recusa;
- Atrasos.

---

## 📲 Telas Principais

### Funcionário
- Dashboard administrativo;
- Gerenciamento de ferramentas;
- Solicitações de empréstimo;
- Registro de devoluções;
- Histórico geral.

### Professor
- Tela inicial;
- Lista de ferramentas;
- Minhas solicitações;
- Histórico;
- Notificações. 

---

## 🚀 Como Executar o Projeto

### Clone o repositório

```bash
git clone https://github.com/ArthurTeixeiraS/FerramentariaSATC
