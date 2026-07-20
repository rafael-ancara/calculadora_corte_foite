Esses texto de vibecoding se passa às vezes

# Calculadora de Corte e Aproveitamento de Papel 📄✂️

Uma aplicação web completa e extremamente moderna construída em **React**, **TypeScript**, **Vite** e **Tailwind CSS (v4)**. Ela foi desenvolvida especificamente para profissionais de gráficas, cartonagem, encadernação e design que precisam otimizar planos de corte de folhas de forma rápida, interativa e visual.

---

## ✨ Recursos Principais

- **Algoritmo de Otimização 2D Avançado**: Algoritmo inteligente baseado em heurísticas de empacotamento bidimensional (Guilhotina e Best-Fit) para maximizar a eficiência e minimizar o desperdício de papel.
- **Grão/Fibra de Papel Sensível**: Opção para respeitar ou ignorar a direção do grão do papel (fibra), garantindo dobras e impressões perfeitas.
- **Visualizador Interativo**: Desenho vetorial proporcional de cada chapa, mostrando o posicionamento exato de cada pedaço a ser cortado.
- **Gráficos de Desempenho**: Estatísticas em tempo real sobre eficiência geral, quantidade de folhas necessárias, área útil aproveitada e sobras.
- **Divisão Inteligente**: Ferramenta de aproveitamento instantâneo com divisões clássicas (1/2, 1/4, 1/8, 1/12, etc.) baseadas nos padrões nacionais e internacionais.
- **Exportação em SVG de Alta Qualidade**: Permite exportar o plano de corte gerado como arquivo `.svg` vetorizado pronto para ser importado no CorelDraw, Adobe Illustrator ou enviado diretamente para mesas de corte.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi estruturado seguindo as melhores práticas modernas de desenvolvimento web:

- **Vite 6**: O empacotador de módulos mais rápido e moderno para o ecossistema frontend.
- **React 19**: A biblioteca de UI declarativa mais popular, utilizando Hooks avançados e gerenciamento de estado eficiente.
- **TypeScript**: Tipagem estática rigorosa para garantir estabilidade, segurança de código e facilidade de manutenção.
- **Tailwind CSS v4**: Framework de estilização de última geração para uma interface limpa, responsiva e de alta fidelidade visual.
- **Lucide React**: Biblioteca de ícones vetoriais modernos e consistentes.

---

## 🚀 Como Executar o Projeto Localmente

Siga os passos simples abaixo para rodar o projeto na sua máquina:

### 1. Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina (versão 18 ou superior recomendada).

### 2. Clonar ou baixar o projeto
Se você exportou o projeto como um arquivo ZIP, descompacte-o em uma pasta de sua preferência.

### 3. Instalar as dependências
Abra o terminal na pasta raiz do projeto e execute:
```bash
npm install
```

### 4. Iniciar o servidor de desenvolvimento
Para rodar o projeto em modo de desenvolvimento local com recarregamento rápido (Fast Refresh), execute:
```bash
npm run dev
```
O console exibirá o endereço local, geralmente `http://localhost:3000` ou `http://localhost:5173`. Abra esse link no seu navegador.

### 5. Compilar para Produção (Build)
Para gerar uma build otimizada e minificada pronta para produção (deploy), execute:
```bash
npm run build
```
Isso criará uma pasta `dist/` contendo todo o HTML, CSS e JS otimizados para serem hospedados em qualquer servidor estático (como Vercel, Netlify, GitHub Pages, Firebase Hosting ou AWS S3).

### 6. Executar o Linter e Verificação de Tipos
Para verificar se existem erros de digitação ou de consistência de tipos no TypeScript, execute:
```bash
npm run lint
```

---

## 📂 Estrutura de Arquivos

Abaixo está o mapeamento dos principais componentes do projeto:

```text
├── src/
│   ├── utils/
│   │   └── optimizer.ts     # Core do algoritmo de otimização 2D e cálculo de aproveitamento
│   ├── App.tsx              # Componente principal com toda a UI, formulários e gráficos
│   ├── main.tsx             # Arquivo de entrada do React que inicializa a aplicação
│   ├── index.css            # Folha de estilo global que importa o Tailwind CSS
│   └── vite-env.d.ts        # Arquivo de tipos de ambiente do Vite
├── index.html               # Ponto de entrada do documento HTML
├── package.json             # Dependências do projeto e scripts npm
├── tsconfig.json            # Configurações do compilador TypeScript
├── vite.config.ts           # Configurações avançadas do empacotador Vite
└── README.md                # Este documento de documentação
```

---

## 📐 Contribuição e Customização

Sinta-se à vontade para expandir o algoritmo de otimização em `src/utils/optimizer.ts` ou ajustar a paleta de cores e o comportamento responsivo diretamente no arquivo `src/App.tsx`. O projeto é 100% livre e adaptável às suas necessidades comerciais ou pessoais.
