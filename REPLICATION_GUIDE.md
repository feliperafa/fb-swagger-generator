# FB Swagger Generator - Replication Guide

**Last Updated**: 2026-05-07  
**Version**: 1.0.0  
**Status**: ✅ Production Ready (Deployed on Vercel)

## 📋 Project Overview

**Purpose**: SPA (Next.js) that automatically generates OpenAPI 3.0 Swagger documentation from Java microservice controllers in GitHub repositories.

**Key Value**: Users authenticate with GitHub OAuth (no manual token copying), specify an organization + repository prefix, app analyzes Java controllers, and exports to JSON/YAML for import into Insomnia/Postman.

**Live Demo**: https://fb-swagger-generator.vercel.app

**Stack**: 
- Frontend: Next.js 16.2.5 + TypeScript + React 19.2.4 + Tailwind CSS 4
- Backend: Next.js API Routes (Node.js)
- Auth: NextAuth.js 4 + GitHub OAuth (HTTP-only secure cookies)
- External API: GitHub REST API v3
- Deployment: Vercel

---

## 🏗️ Architecture

### File Structure
```
app/
├── api/
│   ├── auth/[...nextauth]/route.ts          # NextAuth handler
│   └── analyze/route.ts                      # POST: analyze repos
├── components/
│   ├── ConfigForm.tsx                        # OAuth login + org/prefix input
│   └── ResultsView.tsx                       # Endpoints preview + download
├── lib/
│   ├── auth.ts                               # NextAuth config
│   ├── github.ts                             # GitHub API client (fetch repos, files)
│   ├── javaParser.ts                         # Regex parser: Java → endpoints
│   └── openAPIGenerator.ts                   # Endpoints → OpenAPI 3.0 JSON
├── types/
│   ├── index.ts                              # All interfaces
│   └── next-auth.d.ts                        # Session type extensions
├── providers.tsx                             # SessionProvider wrapper
├── layout.tsx                                # Root layout + Providers
├── page.tsx                                  # Main SPA page
└── globals.css                               # Tailwind imports
```

---

## 🔑 Core Data Flow

### 1. Authentication (OAuth)
```
User clicks "Sign in with GitHub"
  → Redirect to github.com/login/oauth/authorize (client-side)
  → User approves
  → GitHub redirects to /api/auth/callback/github
  → NextAuth exchanges code for access_token
  → Session cookie set (HTTP-only, server-side)
  → User sees name + "Sign out"
```

### 2. Analysis
```
User fills: orgUrl (https://github.com/myorg) + teamPrefix (fb)
User clicks "Analyze Repositories"
  → POST /api/analyze { orgUrl, teamPrefix }
  → Server reads session.accessToken
  → GitHubClient lists repos matching prefix
  → For each repo:
     - Fetch file tree (recursive) → find *Controller.java
     - Fetch file content → parse with regex
     - Extract: @RequestMapping, @GetMapping, @PathVariable, etc.
  → OpenAPIGenerator consolidates endpoints
  → Return OpenAPI spec + summary
User can download as JSON/YAML
```

---

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- GitHub account
- GitHub OAuth App (create at https://github.com/settings/developers)

### Environment Setup

1. **Create GitHub OAuth App**
   - Homepage URL: `http://localhost:3000` (local) or `https://your-domain.vercel.app` (prod)
   - Callback URL: `http://localhost:3000/api/auth/callback/github` (local) or `https://your-domain.vercel.app/api/auth/callback/github` (prod)

2. **Create `.env.local`**
   ```env
   GITHUB_CLIENT_ID=<your-client-id>
   GITHUB_CLIENT_SECRET=<your-client-secret>
   NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Install & Run**
   ```bash
   npm install
   npm run dev
   # Open http://localhost:3000
   ```

### Production (Vercel)

1. Push code to GitHub
2. Import repo in Vercel
3. Add env vars: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (set to your Vercel domain)
4. Deploy

---

## 📦 Dependencies

### Runtime
- `next` (16.2.5): React framework + API routes
- `react` (19.2.4): UI library
- `react-dom` (19.2.4): DOM renderer
- `next-auth` (4.x): OAuth + session management

### Dev
- `typescript` (^5): Type safety
- `tailwindcss` (^4): Styling
- `@types/node`, `@types/react`: Type definitions
- `eslint`: Linting

**Note**: No database. No external state storage. All ephemeral (per-session).

---

## 🎯 Key Implementation Details

### NextAuth Configuration (`app/lib/auth.ts`)
```typescript
authOptions = {
  providers: [GitHubProvider(clientId, clientSecret)],
  callbacks: {
    jwt({ token, account }) { 
      if (account) token.accessToken = account.access_token; 
      return token; 
    },
    session({ session, token }) { 
      session.accessToken = token.accessToken; 
      return session; 
    },
  },
}
```
**Why**: Moves token to server-side session → never exposed to client localStorage.

### GitHub API Client (`app/lib/github.ts`)
```typescript
class GitHubClient {
  request(endpoint) { 
    // All calls: Authorization: token {accessToken}
    // Handles 401/403 with detailed error messages
  }
  listRepositoriesByOrg(org, prefix) { 
    // GET /orgs/{org}/repos?type=all&per_page=100
    // Filters by prefix locally
  }
  listFilesInDirectory(owner, repo, path, regex) { 
    // GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1
    // Matches regex on file paths
  }
  getFileContent(owner, repo, path) { 
    // GET /repos/{owner}/{repo}/contents/{path}
    // Returns raw text
  }
}
```

### Java Parser (`app/lib/javaParser.ts`)
Uses regex (not AST) for speed. Detects:
- `@RestController` / `@Controller` class declarations
- `@RequestMapping` (base path)
- `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping`, `@DeleteMapping`
- `@PathVariable`, `@RequestParam`, `@RequestHeader`, `@RequestBody`
- Method names, return types
- Type mappings: String→string, Integer→integer, Date→string, etc.

**Key regex patterns**:
```
@(\w+Mapping)\s*\(\s*["']([^"']+)["']
@PathVariable\s*String\s+(\w+)
@RequestBody\s+(\w+)\s+(\w+)
```

### OpenAPI Generator (`app/lib/openAPIGenerator.ts`)
```typescript
generateFromRepositories(analyses, title) {
  spec = { openapi: "3.0.0", info, paths: {} }
  
  For each RepositoryAnalysis:
    For each endpoint:
      path = endpoint.path
      spec.paths[path][method.toLowerCase()] = {
        operationId, tags, parameters, requestBody, responses
      }
  
  return spec
}
```

Spec format is compatible with Insomnia, Postman, Swagger UI.

---

## 🔄 API Endpoints

### `POST /api/analyze`
**Request Body**:
```json
{
  "orgUrl": "https://github.com/your-org",
  "teamPrefix": "fb"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Successfully analyzed 3 repositories",
  "data": { /* OpenAPI 3.0 spec */ },
  "repositories": [
    { "name": "fb-srv", "endpoints": 12, "hasExistingSwagger": false }
  ]
}
```

**Auth**: Requires valid NextAuth session (cookie).
**Error Handling**: Returns 401 if not authenticated, 400 if missing fields, 500 if analysis fails.

---

## 🎨 UI Components

### ConfigForm (`app/components/ConfigForm.tsx`)
- Displays: Sign-in button OR logged-in user + fields
- Fields: Organization URL, Team Prefix
- Persists to localStorage (orgUrl, teamPrefix only — NO token)
- Calls `POST /api/analyze`

### ResultsView (`app/components/ResultsView.tsx`)
- Success banner + summary grid (repos with endpoint counts)
- Expandable repo sections showing endpoints (method + path)
- Download buttons: JSON, YAML
- Copy-to-clipboard
- "New Analysis" button to reset

---

## 🚀 Performance & Token Optimization

### What to Avoid in Replica
1. **Don't fetch all commits/PRs** → scope GitHub API calls narrowly (repos, tree, file contents only)
2. **Don't parse AST** → regex is sufficient and faster for Java controllers
3. **Don't store tokens in localStorage** → use NextAuth session (HTTP-only cookies)
4. **Don't make N+1 requests** → batch file fetches or use concurrent loops
5. **Don't persist user data** → app is stateless per-session

### Optimizations Already In Place
- Tree endpoint (recursive=1): Fetch entire file structure in one call
- Raw content endpoint: No HTML parsing, pure text
- Regex matching: O(n) scanning vs AST construction
- No database/caching: Fresh analysis every time (acceptable for SPA)
- Tailwind JIT: Only CSS classes actually used

---

## 📝 Type Definitions (`app/types/index.ts`)

```typescript
interface AppConfig { orgUrl: string; teamPrefix: string }

interface JavaEndpoint {
  method: string;       // GET, POST, etc
  path: string;         // /api/users/{id}
  methodName: string;   // getUser
  className: string;    // UserController
  params?: JavaParam[];
  requestBody?: JavaRequestBody;
  returnType?: string;
}

interface JavaParam {
  name: string;
  type: string;
  required?: boolean;
  in: 'query' | 'path' | 'header';
}

interface RepositoryAnalysis {
  repo: GitHubRepo;
  endpoints: JavaEndpoint[];
  hasExistingSwagger: boolean;
}

interface OpenAPISpec {
  openapi: "3.0.0";
  info: { title, version, description? };
  paths: Record<string, any>;
  components?: { schemas?: Record<string, any> };
}

interface ParserResult {
  status: 'success' | 'error' | 'loading';
  message: string;
  data?: OpenAPISpec;
  repositories?: RepositoryAnalysis[];
}
```

---

## 🔐 Security Notes

- **OAuth tokens**: Never stored client-side. Moved to HTTP-only cookie via NextAuth.
- **GitHub API errors**: 401/403 detected and reported with helpful messages (especially for corporate SAML repos).
- **No user data persisted**: Everything ephemeral per session.
- **Env vars**: `.env.local` ignored in git; `.env.example` documents required vars.

---

## 🧪 Testing Checklist

1. **Local OAuth flow**: Click sign-in, approve GitHub, confirm user name shows
2. **Empty org**: Fill in non-existent org → error message
3. **No matching repos**: Valid org, no repos with prefix → error message
4. **Parse Java**: Fill in valid org + prefix → shows endpoint count
5. **Download formats**: JSON and YAML buttons work, files valid
6. **Session persistence**: Close tab, reopen → user still logged in
7. **Sign out**: Click sign-out → redirected to sign-in screen

---

## 🚢 Deployment Checklist (Vercel)

### Pre-Deploy
- [ ] GitHub OAuth App created at https://github.com/settings/developers
- [ ] OAuth App callback URL: `https://fb-swagger-generator.vercel.app/api/auth/callback/github`
- [ ] `.env.local` NOT committed (in .gitignore)
- [ ] `.env.example` documents all required vars
- [ ] `npm run build` passes without errors locally

### Vercel Configuration
- [ ] Project imported in Vercel
- [ ] Environment Variables set in Vercel Settings:
  - `GITHUB_CLIENT_ID` = (from OAuth App)
  - `GITHUB_CLIENT_SECRET` = (from OAuth App)
  - `NEXTAUTH_SECRET` = (generated: `openssl rand -base64 32`)
  - `NEXTAUTH_URL` = `https://fb-swagger-generator.vercel.app`
- [ ] All 4 env vars have non-empty values
- [ ] **Redeploy after setting env vars** (not just auto-deploy)

### Post-Deploy Testing
- [ ] OAuth flow works (click "Sign in with GitHub")
- [ ] User name displays after login
- [ ] Can fill org URL + prefix and analyze
- [ ] Download buttons work (JSON/YAML)
- [ ] "Download Repository" button in footer works

---

## 🔧 Troubleshooting Common Issues

### Issue: "There is a problem with the server configuration"
**Cause**: `NEXTAUTH_SECRET` missing or empty in Vercel  
**Fix**:
1. Generate secret: `openssl rand -base64 32`
2. Add to Vercel env vars (don't leave empty)
3. **Redeploy** (not just deploy, use redeploy button)
4. Clear browser cache (Ctrl+Shift+Delete or private window)

### Issue: GitHub OAuth redirects to error page
**Cause**: Callback URL mismatch between GitHub OAuth App and Vercel domain  
**Fix**:
1. Verify GitHub OAuth App callback: `https://fb-swagger-generator.vercel.app/api/auth/callback/github`
2. Verify Vercel domain matches (check deployment URL)
3. Ensure callback URL uses `https://` (not `http://`)

### Issue: 500 errors on `/api/auth/*` endpoints
**Cause**: Environment variables not loaded (stale build)  
**Fix**:
1. Go to Vercel Deployments
2. Click latest deployment
3. Click "Redeploy" button (forces fresh build)
4. Wait for build to complete
5. Test in new private/incognito window

### Issue: "Unexpected token '<'" on analyze
**Cause**: GitHub API returning HTML error (401/403 auth failure)  
**Fix**:
1. Verify `GITHUB_CLIENT_SECRET` is correct in Vercel
2. Check that OAuth App credentials match (Client ID/Secret)
3. Re-test OAuth login flow
4. Check that session token is valid (try logging out + back in)

---

## 🔮 Future Enhancements

1. **Cache analysis results** (Redis or in-memory)
2. **Support OpenAPI 3.1**
3. **Auto-generate client code** (TypeScript, Java, Python)
4. **Webhook integration** (regenerate on push)
5. **Support for @ApiOperation annotations** (existing Swagger in code)
6. **Dark mode**
7. **Multi-user accounts** (store analyses in database)
8. **Scheduled regeneration** (GitHub Actions webhook)

---

## 📌 Critical Code Paths

| Task | Files | Key Function |
|------|-------|---|
| OAuth | `auth.ts`, `[...nextauth]/route.ts`, `ConfigForm.tsx` | `getServerSession(authOptions)` |
| List Repos | `github.ts`, `analyze/route.ts` | `listRepositoriesByOrg()` |
| Parse Java | `javaParser.ts` | `parseControllers(content)` |
| Generate Spec | `openAPIGenerator.ts` | `generateFromRepositories()` |
| Download | `ResultsView.tsx` | `downloadSwagger()`, `downloadYAML()` |

---

## 💡 Prompt for Replica AI

When asking another AI to replicate, provide:

1. **This guide** (all sections above)
2. **Current codebase** (all files in `app/`, `public/`, `package.json`, `next.config.ts`)
3. **Instruction**: "Implement Facebook Swagger Generator exactly as described. Optimize for clarity and minimal token use. Focus on: OAuth flow, GitHub API integration, Java regex parser, OpenAPI generation. Test locally before reporting complete."

**Expected response time**: 5-10 minutes of AI time (30k-50k tokens depending on model).

---

---

## 🔐 GitHub OAuth App Setup (Detailed)

### Create OAuth App
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: `fb-swagger-generator` (or your name)
   - **Homepage URL**: `https://fb-swagger-generator.vercel.app` (your prod domain)
   - **Application description**: `Automatically generate Swagger/OpenAPI docs from Java microservices`
   - **Authorization callback URL**: `https://fb-swagger-generator.vercel.app/api/auth/callback/github`
4. Click "Create OAuth Application"
5. Copy **Client ID** and **Client Secret** → save to Vercel env vars

### Why These Settings?
- **Callback URL** must exactly match NextAuth's `/api/auth/callback/github` route
- **Homepage URL** helps GitHub recognize your app legitimately
- Using OAuth avoids asking users to create/paste Personal Access Tokens

### For Corporate/SAML Organizations
If analyzing repos in orgs with SAML/SSO enabled:
- User must authorize OAuth App for SAML SSO (GitHub prompts automatically)
- App gains repo access token valid for 1 hour
- No manual SAML approval needed—automatic with OAuth flow

---

## 💾 Environment Variables (Complete Reference)

| Variable | Value | Example | Notes |
|----------|-------|---------|-------|
| `GITHUB_CLIENT_ID` | From OAuth App | `abc123def456` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | From OAuth App | `xyz789uvw012` | Keep secret! Never commit. |
| `NEXTAUTH_SECRET` | Random 32-byte string | `abc+/xyz==` | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Full domain URL | `https://fb-swagger-generator.vercel.app` | Must match deployment domain. Use `http://localhost:3000` locally. |

### Local Development (`.env.local`)
```env
GITHUB_CLIENT_ID=your_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_oauth_app_client_secret
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=http://localhost:3000
```

### Production (Vercel Environment Variables)
Same 4 vars, with `NEXTAUTH_URL` pointing to your Vercel domain.

---

## 📚 References

- NextAuth.js Docs: https://next-auth.js.org/getting-started/introduction
- GitHub OAuth: https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app
- GitHub API: https://docs.github.com/en/rest
- OpenAPI 3.0 Spec: https://spec.openapis.org/oas/v3.0.0
- Next.js: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Vercel Deployment: https://vercel.com/docs
