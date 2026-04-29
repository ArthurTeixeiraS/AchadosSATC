# AchadosSATC - Gestão de Achados e Perdidos

## 📱 Sobre o Projeto
O **AchadosSATC** é uma solução mobile desenvolvida para organizar o processo de achados e perdidos do setor de Apoio da faculdade UNISATC. O objetivo principal é facilitar o registro, o acompanhamento e a devolução segura de objetos encontrados na instituição.

O sistema atende a dois perfis principais:
1. **Administrador (Apoio):** Possui controle total (CRUD) sobre os itens, podendo cadastrar, editar, alterar o status e registrar a devolução.
2. **Usuário Comum:** Pode consultar itens disponíveis através de filtros e solicitar a identificação do objeto.

## 🛠️ Tecnologias Utilizadas
- **Framework:** [React Native](https://reactnative.dev/) com [Expo](https://expo.dev/)
- **Linguagem:** TypeScript (para maior qualidade e tipagem do código)
- **Navegação:** [React Navigation](https://reactnavigation.org/) (Stack Navigator)
- **UI:** [React Native Paper](https://callstack.github.io/react-native-paper/) (opcional/sugerido)

## 🔒 Segurança e Protocolo de Devolução
Para garantir que os itens sejam entregues aos donos legítimos, o app implementa:
- **Descrições Restritas:** Detalhes específicos dos itens são ocultados do público geral [10, 11].
- **Validação de Posse:** O atendente deve validar informações que apenas o dono saiba (ex: conteúdo interno, marcas específicas).
- **QR Code de Retirada:** Utilização de QR Code para validação digital e registro da entrega física.
- **Histórico (Logs):** Registro completo de quem cadastrou, alterações de status e quem autorizou a retirada.

## 🚀 Como Executar
Clone o repositório. </br>
Instale as dependências: </br>
Inicie o projeto: </br>
Utilize o Expo GO no seu smartphone para escanear o QR Code.

## 👥 Equipe
Arthur Teixeira Serafim </br>
Davi Chechetto Westphal </br>
Gabriel Fillipe Casagrande Fernandes </br>
Guilherme Rabello Carrer </br>
Ígor da Silva Antunes </br>