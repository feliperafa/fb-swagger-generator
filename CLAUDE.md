# FB Swagger Generator

## 🎯 Projeto

Ferramenta web SPA (Next.js) para **gerar automaticamente documentação Swagger/OpenAPI** a partir de repositórios Java em microserviços.

### Objetivo

Automatizar a criação de arquivos Swagger que podem ser importados diretamente em Insomnia, Postman e outras ferramentas HTTP, a partir da análise de Controllers Java.

### Stack

- **Frontend:** Next.js 15 + TypeScript + React + Tailwind CSS
- **Backend:** Next.js API Routes (Node.js)
- **APIs:** GitHub REST API
- **Formatos:** OpenAPI 3.0 (JSON/YAML)

## 📋 Fluxo Principal

1. Usuário insere: URL da organização GitHub + prefixo da equipe + token pessoal
2. Sistema lista todos os repos que começam com o prefixo (ex: `seu-prefixo-*`)
3. Para cada repo, busca arquivos `*Controller.java` em `src/main/java`
4. Parser extrai endpoints dos controllers (métodos HTTP, paths, parâmetros)
5. Gera um único arquivo OpenAPI 3.0 consolidado
6. Usuário baixa em JSON ou YAML para importar em ferramentas HTTP

## 🏗️ Estrutura do Projeto

```
app/
├── api/                              # Backend
│   ├── analyze/route.ts             # POST /api/analyze - análise completa
│   └── validate-token/route.ts      # POST /api/validate-token - valida token
├── components/                       # Componentes React
│   ├── ConfigForm.tsx               # Formulário de entrada
│   └── ResultsView.tsx              # Exibição e download de resultados
├── lib/                             # Lógica compartilhada
│   ├── github.ts                    # Cliente GitHub API
│   ├── javaParser.ts                # Parser de Java controllers
│   └── openAPIGenerator.ts          # Gerador de OpenAPI
├── types/                           # Tipos TypeScript
│   └── index.ts                     # Definições de tipos compartilhados
└── page.tsx                         # Página principal (SPA)
```

## 🔑 Componentes Principais

### JavaControllerParser (`lib/javaParser.ts`)

Extrai endpoints de arquivos Java:
- Detecta `@RestController` / `@Controller`
- Parse de `@RequestMapping`, `@GetMapping`, `@PostMapping`, etc
- Extrai `@PathVariable`, `@RequestParam`, `@RequestBody`
- Mapeia tipos Java para OpenAPI (String → string, Integer → integer, etc)

### GitHubClient (`lib/github.ts`)

Cliente para GitHub REST API:
- Listar repositórios por organização
- Buscar arquivos por padrão (glob)
- Ler conteúdo de arquivos remotamente (sem clone)

### OpenAPIGenerator (`lib/openAPIGenerator.ts`)

Gera especificação OpenAPI 3.0:
- Consolida endpoints de múltiplos repositórios
- Agrupa por tags (nome do repositório)
- Mapeia tipos Java para schemas OpenAPI
- Cria operações com parâmetros e responses

## 🚀 Como Executar

### Desenvolvimento
```bash
npm run dev
```
Acesse http://localhost:3000

### Build para produção
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t fb-swagger-gen .
docker run -p 3000:3000 fb-swagger-gen
```

## 🔐 Segurança

- Tokens GitHub armazenados **apenas em localStorage** (lado do cliente)
- Nenhuma informação sensível no backend
- Recomenda-se usar token com escopo limitado (`repo`)
- Tokens podem ser revogados em https://github.com/settings/tokens

## 🎨 Interface de Usuário

1. **ConfigForm**: Entrada de dados (token, URL org, prefixo)
2. **ResultsView**: Preview de endpoints e opções de download
3. **Download**: JSON/YAML pronto para Insomnia/Postman

## 🐛 Padrões de Detecção

### Controllers Suportados
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
  @GetMapping("/{id}")
  @PostMapping
  @PutMapping
  @PatchMapping
  @DeleteMapping
}
```

### Parâmetros Suportados
- `@PathVariable` (path parameters)
- `@RequestParam` (query parameters)
- `@RequestHeader` (header parameters)
- `@RequestBody` (request body)

### Tipos Mapeados
- `String` → `string`
- `Integer`, `Long` → `integer`
- `Double`, `Float` → `number`
- `Boolean` → `boolean`
- `Date`, `LocalDate`, `LocalDateTime` → `string`
- `UUID` → `string`

## 📝 Próximos Passos Sugeridos

1. **Melhorias no Parser**
   - [ ] Suporte a `@ApiOperation`, `@ApiParam` (Swagger existente)
   - [ ] Detecção de DTOs e schemas mais inteligente
   - [ ] Suporte a generics (`List<User>`, etc)

2. **UI Melhorias**
   - [ ] Preview em tempo real
   - [ ] Histórico de análises
   - [ ] Edição manual de endpoints
   - [ ] Tema escuro

3. **Features Avançadas**
   - [ ] Cache de análises
   - [ ] Webhooks para regeneração automática
   - [ ] Suporte a OpenAPI 3.1
   - [ ] Geração de código cliente (TypeScript, Java, etc)
   - [ ] Documentação automática de modelos (DTOs)

4. **Deploy**
   - [ ] Dockerfile otimizado
   - [ ] CI/CD pipeline
   - [ ] Publicar em Vercel/Heroku

## 💡 Notas Técnicas

- Parser usa **regex** (não AST) - rápido mas com limitações
- GitHub API permite 60 req/hora sem token, 5000 com token
- OpenAPI 3.0 é compatível com Insomnia, Postman, Swagger UI
- Configuração persiste em localStorage (compartilhável entre abas)

## 💡 Sobre

Ferramenta para gerar documentação Swagger/OpenAPI de repositórios Java em microserviços.
