# 🚀 Quick Start - FB Swagger Generator

## 1️⃣ Preparar Ambiente

```bash
# Entrar no diretório do projeto
cd pupj-swagger-generator

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

## 2️⃣ Obter GitHub Token

1. Vá para https://github.com/settings/tokens
2. Clique em "Generate new token" → "Generate new token (classic)"
3. Nomeie: `fb-swagger-gen` (opcional)
4. Selecione permissão: `repo` (acesso completo)
5. Gere e **copie o token** (você não verá novamente!)

## 3️⃣ Usar a Aplicação

### Passo 1: Configuração
```
GitHub Token: cole seu token
Organization URL: https://github.com/sua-empresa
Team Prefix: pupj (ou outro prefixo)
```

### Passo 2: Validar Token
- Clique em "Validar"
- Você deve ver: ✓ Token is valid

### Passo 3: Analisar
- Clique em "Analisar Repositórios"
- Aguarde a análise (pode levar alguns segundos)

### Passo 4: Download
- **Download JSON**: Para Postman
- **Download YAML**: Para Insomnia/Swagger UI
- **Copy JSON**: Para colar em lugar nenhum

## 4️⃣ Importar no Insomnia

1. Clique em "Create" → "Import"
2. Selecione "Raw JSON"
3. Cole o conteúdo (Ctrl+V)
4. Clique em "Import"
5. Pronto! ✅

## 5️⃣ Importar no Postman

1. Clique em "Import" (canto superior esquerdo)
2. Selecione aba "Raw text"
3. Cole o JSON
4. Clique em "Continue" → "Import"
5. Pronto! ✅

## ⚙️ Configuração Salva

Suas credenciais são salvas **localmente no navegador** (localStorage), então não precisa inserir toda vez!

## 🐛 Debug

Se tiver problemas:

```bash
# Ver logs do servidor
npm run dev

# Ver console do navegador (F12 → Console)
# Procure por erros vermelhos

# Validar token manualmente
curl -H "Authorization: token SEU_TOKEN" https://api.github.com/user
```

## 📦 Estrutura de Repos Esperada

```
sua-empresa/
├── pupj-srv/           ← Detectado
├── pupj-bff/           ← Detectado
├── pupj-sta/           ← Detectado
└── outro-prefixo-api/  ← Ignorado
```

Cada repo deve ter:
```
src/
└── main/
    └── java/
        └── com/
            └── example/
                └── UserController.java  ← Parser busca aqui
```

## 🎯 Exemplo de Controller Detectado

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        // ...
    }

    @PostMapping
    public ResponseEntity<User> create(@RequestBody CreateUserRequest req) {
        // ...
    }

    @GetMapping
    public ResponseEntity<Page<User>> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        // ...
    }
}
```

**Resultado:**
```
GET  /api/users/{id}
POST /api/users
GET  /api/users?page=0&size=10
```

## 💾 Próximas Análises

Suas configurações ficam salvas! Na próxima vez:

1. Abra http://localhost:3000
2. Clique em "Analisar Repositórios" (tudo já preenchido)
3. Download do novo Swagger

## ❓ FAQ

**P: Meu token expirou?**
R: Crie um novo em https://github.com/settings/tokens

**P: Não encontra meus repos?**
R: Verifique:
- URL está correta (sem /repo)
- Prefixo está correto
- Seus repos têm esse prefixo
- Token tem permissão `repo`

**P: Diz "nenhum endpoint"?**
R: Verifique:
- Controllers estão em `src/main/java`
- Usam `@RestController` ou `@Controller`
- Têm `@RequestMapping` ou `@GetMapping`, etc

**P: Posso compartilhar com minha equipe?**
R: Sim! Deploy em um servidor (Docker, Vercel, etc) e compartilhe a URL. Cada pessoa usa seu próprio token.

---

**Tá tudo pronto! 🎉 Bora testar?**
