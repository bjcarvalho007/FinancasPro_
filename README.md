# 💰 Finanças Pro — Sistema Financeiro Completo Premium

Um ecossistema web profissional e futurista para controle financeiro pessoal e empresarial. O sistema foi desenvolvido com arquitetura premium de alta performance, total segurança isolada por usuário, e design polido inspirado em gigantes de tecnologia como Stripe, Linear, Notion, e Vercel.

Hospedagem nativa pronta para produção e deploy contínuo em **Cloud Run** ou **Vercel**, integrado com **Firebase Authentication** e **Firestore Database** em tempo real.

---

## 🚀 Funcionalidades Chave

*   **Autenticação Avançada Securitizada**: Cadastro, logins, recuperação de senhas nativas e autenticação Single-Sign-On (SSO) do **Google Auth**. Persistência automática de sessão encriptada.
*   **Controle e Organização por Competência**: Cadastro de movimentações financeiras separadas por mês com filtros dinâmicos de calendário, barreira de quitação de débitos e cálculo automático de sobressalentes de caixa.
*   **Três Fluxos Financeiros de Lançamento**:
    *   `📌 FIXOS`: Despesas constantes mensais (ex: condomínio, aluguel). O sistema gera e planeja automaticamente para todos os meses futuros.
    *   `📊 VARIÁVEIS`: Custos voláteis e casuais do período atual (ex: alimentação, reparos).
    *   `💳 PARCELAMENTOS`: Contas parceladas no cartão que debitam faturas de forma faseada.
*   **IA & Personal Score de Saúde Financeira**: Algoritmo avançado que calcula seu "Financial Health Score" (0–100) com base na taxa de comprometimento de renda, liquidez de caixa e proporção de endividamento por cartão.
*   **Gráficos SVG Proprietários e Interativos**: Gráficos de colunas responsivos que renderizam a distribuição e alocação orçamentária por setor em tempo real com tooltips flutuantes de hover.
*   **Notificações & Alertas Rápidos de Vencimento**: Contador automatizado que identifica faturas vencendo no dia atual ou no dia seguinte, projetando alertas diretos e não bloqueantes no rodapé, permitindo quitações imediatas com 1-clique.
*   **Metas de Poupança & Reservas de Emergência**: Painel exclusivo para criação de metas de longo prazo com barras de progresso animadas e ferramenta integrada de créditos (depósitos) e saques rápidos na carteira de destino.
*   **Configurações Multi-Cambiais Globais**: Preferências para conversão e exibição imediata em **Reais (R$)**, **Dólares ($)**, e **Euros (€)**, além de tema personalizado e exclusão definitiva de contas.
*   **Exportação Total de Escopo Planilheiro**: Botão integrado de exportação de dados que gera planilhas estruturadas no formato de arquivo **.CSV** pronto para importação no Excel ou Google Sheets.

---

## 🛠️ Stack Tecnológica

*   **Frontend**: React (v19.0) + TypeScript + Vite
*   **Estilização**: Tailwind CSS (v4.0) com fontes modernas (Plus Jakarta Sans, Inter, JetBrains Mono)
*   **Animações**: Motion (`motion/react`) para transições glassmorphism e overlays
*   **Backend & Conexões**: Firebase SDK (Auth + Firestore Enterprise DB)
*   **Controle de Qualidade**: ESLint + TypeScript --noEmit Compiladores estritos

---

## 📂 Estrutura de Pastas de Produção

```
├── firebase-applet-config.json  # Credenciais dinâmicas do Firebase provisionadas
├── firebase-blueprint.json      # Modelo de Entidades e Mapeamento de Coleções do Banco
├── firestore.rules              # Regras de Segurança Hardened (Proteção Antivirus Zero-Trust)
├── index.html                   # HTML Principal PWA friendly
├── package.json                 # Relação de dependências e scripts de builds
├── tsconfig.json                # Configuração strict do TypeScript
├── vite.config.ts               # Bundler Vite e plug-ins reativos
└── src/
    ├── App.tsx                  # Ponto de Entrada reativo e controle de estado do painel
    ├── firebase.ts              # Inicializadores, Operações e Handlers de Erro de Banco
    ├── index.css                # CSS Global com fonts imports e temas definidos
    ├── main.tsx                 # Bootstrap do React
    ├── types.ts                 # Interfaces de dados fortemente tipados (Goal, Transaction, etc)
    └── components/              # Sub-módulos acoplados e visualmente isolados
        ├── AuthScreen.tsx       # Controle de cadastro, login e reset
        ├── DashboardAnalytics.tsx # Score gauge, gráficos de coluna e recomendações locais
        ├── GoalsPanel.tsx       # Metas, prazos, fomento e retiradas de carteiras
        └── SettingsPanel.tsx    # Moedas, temas, presets médios e exportador CSV
```

---

## ⚙️ Variáveis de Ambiente (`.env.example`)

Adicione seu par de credenciais de produção no painel ou crie um arquivo `.env` local:

```env
# GEMINI_API_KEY: Opcional para acionar conselhos preditivos se requisitado
GEMINI_API_KEY="SUA_CHAVE_GEMINI_DE_PRODUCAO"

# APP_URL: Emissora gerada automaticamente para selflinks e retornos
APP_URL="SUA_URL_DE_APLICACAO"
```

---

## 📦 Instalação e Execução Local

Siga o passo a passo para inicializar o ambiente localmente:

1.  **Instalar dependências**:
    ```bash
    npm install
    ```

3.  **Iniciar Servidor de Desenvolvimento**:
    ```bash
    npm run dev
    ```
    Isso iniciará o Vite apontando para a porta `3000` (http://localhost:3000), que é o canal externo de visualização mapeado.

4.  **Rodar Verificação estrita de Tipagem**:
    ```bash
    npm run lint
    ```

5.  **Gerar Pacotes de Produção**:
    ```bash
    npm run build
    ```

---

## 🔒 Regras de Segurança Hardened (`firestore.rules`)

Nossas regras implementadas seguem princípios de **Zero-Trust Attribute-Based Access Control**:
*   Acesso de leitura (`get`, `list`) e escritas (`create`, `update`, `delete`) restritos estritamente ao proprietário real do UID.
*   Validação estrita de chaves e tipos (`isValidTransaction`, `isValidGoal`) antes de commits para o Firestore, prevenindo ataques de injeção de lixo de campos ocultos (Shadow Fields).
*   Garantia de imutabilidade do campo `userId` e identificadores de vinculação.
*   Medidas de tamanho nas strings limitadas a no máximo 150 caracteres para evitar ataques de Denial of Wallet através de excessos de carga.

---

## ☁️ Deploy no GitHub e Hospedagem Vercel

### Para Deploy na Vercel:
1.  Conecte seu repositório GitHub no painel da **Vercel**.
2.  Adicione as variáveis de ambiente equivalentes mapeadas em `firebase-applet-config.json` como Variáveis de Ambiente no painel do Projeto na Vercel.
3.  Defina o diretório de build como `dist`.
4.  Clique em **Deploy**! A compilação Vite otimizará tudo automaticamente em tempo de execução.
