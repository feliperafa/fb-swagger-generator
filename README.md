# 📚 FB Swagger Generator

Ferramenta web automatizada para gerar documentação Swagger/OpenAPI a partir de repositórios Java em microserviços.

## ✨ Funcionalidades

- 🔍 **Detecção Automática**: Encontra controllers Java e extrai endpoints automaticamente
- 📦 **Multi-Repositório**: Analisa múltiplos repositórios correspondentes ao prefixo da equipe
- 💾 **Múltiplos Formatos**: Exporta como JSON ou YAML
- 🔐 **Configurável**: Cada membro da equipe usa seu próprio token GitHub
- 🧠 **Inteligente**: Detecta Swagger existente e o usa como base
- 📥 **Compatível**: Importa diretamente no Insomnia, Postman e outras ferramentas

## 🚀 Quick Start

### Requisitos
- Node.js 18+
- npm ou yarn
- GitHub Personal Access Token com acesso a repositórios

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000

### Build para Produção

```bash
npm run build
npm start
```

## 📖 Como Usar

### 1. **Obter GitHub Personal Access Token**
   - Vá para https://github.com/settings/tokens
   - Crie um novo token (clássico)
   - Dê permissão `repo` (acesso completo a repositórios)
   - Copie o token

### 2. **Configurar a Aplicação**
   - Abra http://localhost:3000
   - Cole seu GitHub token
   - Insira a URL da organização (ex: `https://github.com/sua-empresa`)
   - Insira o prefixo da equipe (ex: seu prefixo)
   - Clique em "Validar" para confirmar o token

### 3. **Gerar Swagger**
   - Clique em "Analisar Repositórios"
   - Aguarde a análise dos repositórios
   - Veja o preview dos endpoints encontrados

### 4. **Exportar**
   - **Baixar JSON**: Arquivo pronto para Postman
   - **Baixar YAML**: Arquivo pronto para Swagger UI
   - **Copiar JSON**: Copiar para área de transferência

### 5. **Importar no Insomnia/Postman**

#### Insomnia
1. Menu → Import
2. Selecione "Raw JSON"
3. Cole o conteúdo ou selecione o arquivo
4. Done!

#### Postman
1. Collections → Import
2. Cole o arquivo JSON
3. Done!

## 🏗️ Arquitetura

```
fb-swagger-generator/
├── app/
│   ├── api/                    # API Routes (Backend)
│   │   ├── analyze/           # Análise e geração Swagger
│   │   └── validate-token/    # Validação de token GitHub
│   ├── components/            # Componentes React
│   │   ├── ConfigForm.tsx     # Formulário de configuração
│   │   └── ResultsView.tsx    # Visualização de resultados
│   ├── lib/                   # Utilitários
│   │   ├── github.ts          # Cliente GitHub API
│   │   ├── javaParser.ts      # Parser de controladores Java
│   │   └── openAPIGenerator.ts # Gerador de OpenAPI
│   ├── types/                 # Tipos TypeScript
│   └── page.tsx               # Página principal
└── public/                    # Arquivos estáticos
```

## 🔍 Como Funciona

### Fluxo de Análise

```
1. GitHub API → Lista repos com prefix do seu time (ex: seu-prefixo-*)
2. Para cada repositório:
   - Busca arquivos Controller.java em src/main/java
   - Parse dos decoradores (@RequestMapping, @GetMapping, etc)
   - Extração de paths, métodos HTTP, parâmetros
3. Consolidação em um único OpenAPI 3.0
4. Organização por repositório e tags
5. Export em JSON/YAML
```

### Parser Java

O parser detecta:
- ✅ `@RestController` / `@Controller`
- ✅ `@RequestMapping` (nivel classe e método)
- ✅ `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping`, `@DeleteMapping`
- ✅ `@PathVariable`, `@RequestParam`, `@RequestBody`
- ✅ Tipos de parâmetros (String, Integer, Long, Boolean, etc)
- ✅ Métodos HTTP (GET, POST, PUT, PATCH, DELETE, OPTIONS)

## 🔐 Segurança

- ✅ Tokens armazenados apenas localmente (localStorage)
- ✅ Nenhuma informação sensível é enviada para servidores
- ✅ Recomenda-se usar um token com escopo limitado
- ✅ Tokens podem ser revogados a qualquer momento

## 🐛 Troubleshooting

### "Token inválido"
- Verifique se o token foi copiado corretamente
- Confirme que o token tem permissão `repo`
- Token expirou? Crie um novo em https://github.com/settings/tokens

### "Repositórios não encontrados"
- Verifique se a URL da organização está correta (sem trailing slash)
- Confirme que o prefixo está correto
- Verifique se há repos com esse prefixo na organização

### "Nenhum endpoint encontrado"
- Confirme que há arquivos `*Controller.java` no repositório
- Verifique se os controllers usam `@RestController` ou `@Controller`
- Controllers devem estar em `src/main/java`

## 📦 Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["npm", "start"]
```

```bash
docker build -t fb-swagger-gen .
docker run -p 3000:3000 fb-swagger-gen
```

### Vercel

```bash
npm install -g vercel
vercel
```

---

**Ferramenta para gerar documentação Swagger/OpenAPI de microserviços Java** 🚀
