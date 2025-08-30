
 # <img width="50" height="50" alt="inventorinho" src="https://github.com/user-attachments/assets/a44bcb3e-1165-43a9-ba16-06a33a13257f" /> Inventorinho  
 
*Um Sistema de Gerenciamento de Estoquezinho!*

Este é um aplicativo móvel de gerenciamento de estoque, construído com React Native, que permite controlar produtos, gerenciar o carrinho de compras e registrar transações de vendas. 

# Inventorinho como Projeto Extensionista
O aplicativo foi feito com o intuito de realizar uma atividade de extensão da Faculdade Estácio para auxiliar na comunidade local com uso de tecnologias de dispositivos móveis, tendo em vista o projeto de extensão da 
matéria de Programação para Dispositivos Móveis em Android, nesse caso utilizando as tecnologias React e Expo, lecionadas na disciplina. O projeto se dispõe a identificar uma situação-problema com os envolvidos na comunidade local,
que nesse caso, foi uma empreendedora individual que também era Artesã e atualmente vende os produtos do seu Atêlie em pontos turísticos do Vale do São Francisco. Como única fornecedora dos seus produtos e com auxílio
do seu filho, ela requisitou um aplicativo onde pudesse gerenciar seu estoque de forma simples e acessível, aplicar taxas das associações em que participa de forma mais rápida para agilizar as vendas e ter um resumo das sua movimentação 
mensal e semanal. Entre outros requisitos, foi feito a parceria onde seria entregue um aplicativo pronto para uso em duas semanas. Admitidamente foi um projeto rápido e comum, porém foi útil para aplicação de conhecimentos desenvolvidos 
durante a matéria. Assim atendendo uma parte da demanda comunitária de parte artística e turística local. 

# As Funcionalidades
O aplicativo oferece um conjunto simples de ferramentas para gerenciar estoques, vendas e movimentações, incluindo:

- Gerenciamento de Inventário: Adicione, edite e remova produtos facilmente. Cada produto possui nome, quantidade em estoque e preço.
- Carrinho de Compras Dinâmico: Adicione itens do seu inventário ao carrinho, ajuste as quantidades e remova itens antes de finalizar a venda.
- Sistema de Transações: Finalize uma venda e deduza automaticamente os itens do estoque. Todas as transações são registradas com detalhes como data, itens vendidos, subtotal, descontos aplicados, impostos e total final.
- Cálculo Flexível: O carrinho calcula subtotais, aplica descontos (em valor ou porcentagem) e adiciona impostos fixos.
- Filtros de Transação: Visualize o histórico de vendas filtrando por mês ou por semana atual para uma análise rápida.
- Persistência de Dados: Todos os dados (inventário, carrinho, transações e impostos) são salvos localmente no dispositivo usando AsyncStorage, garantindo que as informações não se percam ao fechar o aplicativo.
- Importação/Exportação (CSV): Possibilidade de importar produtos em massa através de um arquivo CSV e exportar o histórico de transações para análise.

# Tecnologias Utilizadas
- React Native: Framework para a construção de aplicativos móveis multiplataforma.
- Expo: Ferramenta que facilita o desenvolvimento, build e deploy de aplicativos React Native.
- AsyncStorage: Biblioteca para armazenamento de dados local no dispositivo.
- React Navigation: Biblioteca de roteamento e navegação para o aplicativo.
- @react-native-picker/picker: Componente para seleção de itens em listas.

# Como Executar o Projeto
Siga os passos abaixo para clonar e rodar o projeto em seu ambiente de desenvolvimento.

## Pré-requisitos
Certifique-se de que você tem o Node.js e o Expo CLI instalados em sua máquina.
 1. Instale o Node.js (se ainda não tiver)
 2. Baixe em [https://nodejs.org/](https://nodejs.org/)

 3. Instale o Expo CLI globalmente
 
```

npm install -g expo-cli

```

# Instalando Inventorinho
 4. Clone o repositório:
```

git clone [https://github.com/marisaguimaraes/inventorinho.git](https://github.com/marisaguimaraes/inventorinho.git)
cd inventorinho

```

5. Instale as dependências do projeto:
```

npm install

```
*Em caso de Erro com apenas o npm install, instala essas dependências aqui por precaução*

```

npm install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
npm install @react-native-picker/picker
npm install @react-native-async-storage/async-storage

```

6. Inicie o aplicativo:
```

expo start

```

Isso abrirá uma nova janela no seu navegador com o Expo Dev Tools. De lá, você pode escanear o código QR com o aplicativo Expo Go (disponível na App Store e Google Play) para rodar o app em seu celular.

# Licença MIT
Este projeto está licenciado sob a Licença MIT.
