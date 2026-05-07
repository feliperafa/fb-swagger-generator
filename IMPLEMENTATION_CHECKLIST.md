# FB Swagger Generator - Implementation Checklist

**Estimated effort**: 2-3 hours  
**Estimated tokens**: 40k-60k  
**Difficulty**: Medium (OAuth + API integration + regex parsing)

---

## Phase 1: Setup (5 min)

- [ ] Create Next.js 16 project with TypeScript
- [ ] Install dependencies: `next-auth@4`, `tailwindcss@4`
- [ ] Create `.env.local` and `.env.example`
- [ ] Setup folder structure: `app/api`, `app/lib`, `app/types`, `app/components`

---

## Phase 2: Authentication (20 min)

### Create `app/lib/auth.ts`
- [ ] Export `authOptions` with NextAuth config
- [ ] Configure GitHub provider (clientId, clientSecret from env)
- [ ] Add JWT callback: store `account.access_token` → `token.accessToken`
- [ ] Add session callback: expose `token.accessToken` → `session.accessToken`
- [ ] Set `pages.signIn = '/'`

### Create `app/api/auth/[...nextauth]/route.ts`
- [ ] Import `authOptions` from `app/lib/auth`
- [ ] Export `GET` and `POST` handlers via `NextAuth(authOptions)`

### Create `app/providers.tsx`
- [ ] `'use client'` directive
- [ ] Export `Providers` component wrapping children with `<SessionProvider>`

### Create `app/types/next-auth.d.ts`
- [ ] Extend `next-auth` `Session` interface: add `accessToken?: string`
- [ ] Extend `next-auth/jwt` `JWT` interface: add `accessToken?: string`

### Update `app/layout.tsx`
- [ ] Import `Providers`
- [ ] Wrap `{children}` with `<Providers>{children}</Providers>`

---

## Phase 3: GitHub API Client (15 min)

### Create `app/lib/github.ts`
- [ ] `GitHubClient` class with constructor taking `token: string`
- [ ] Private method `request(endpoint)`: fetch with auth header, handle 401/403 with detailed messages
- [ ] `listRepositoriesByOrg(org, prefix)`: GET `/orgs/{org}/repos?type=all&per_page=100`, filter by prefix
- [ ] `listFilesInDirectory(owner, repo, path, regex)`: GET `/repos/.../git/trees/HEAD?recursive=1`, match regex
- [ ] `getFileContent(owner, repo, path)`: GET `/repos/.../contents/{path}` (raw), return text or ''

---

## Phase 4: Java Parser (25 min)

### Create `app/lib/javaParser.ts`
- [ ] `JavaControllerParser` class
- [ ] `parseControllers(content, filePath)`: return `JavaEndpoint[]`
  - [ ] Detect `@RestController` and `@Controller`
  - [ ] Find `@RequestMapping` base path
  - [ ] Detect `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping`, `@DeleteMapping`
  - [ ] Extract path from mapping annotation
  - [ ] Find method signature: method name, return type
  - [ ] Parse parameters:
    - [ ] `@PathVariable String varName` → path param
    - [ ] `@RequestParam String varName` → query param
    - [ ] `@RequestHeader String varName` → header param
  - [ ] Parse `@RequestBody ClassName body` → store class name
  - [ ] Map Java types to OpenAPI: String→string, Integer/Long→integer, Double/Float→number, Boolean→boolean, Date/LocalDate/LocalDateTime/UUID→string

---

## Phase 5: OpenAPI Generator (20 min)

### Create `app/lib/openAPIGenerator.ts`
- [ ] `OpenAPIGenerator` class
- [ ] `generateFromRepositories(analyses: RepositoryAnalysis[], title: string)`: return `OpenAPISpec`
  - [ ] Initialize spec: `{ openapi: "3.0.0", info: {title, version: "1.0.0"}, paths: {} }`
  - [ ] For each repo analysis:
    - [ ] Create tag: `{name: repo.name}`
    - [ ] For each endpoint:
      - [ ] Group by path: `spec.paths[endpoint.path]`
      - [ ] Add method: `spec.paths[path][method.toLowerCase()] = {...}`
      - [ ] Fill: operationId, tags, parameters, requestBody, responses
      - [ ] Default 200 response: `{ description: "Success", content: { "application/json": {} } }`

---

## Phase 6: Types (10 min)

### Update `app/types/index.ts`
- [ ] `GitHubRepo`: name, full_name, html_url, description
- [ ] `JavaEndpoint`: method, path, methodName, className, params?, requestBody?, returnType?, description?
- [ ] `JavaParam`: name, type, required?, in ('query'|'path'|'header')
- [ ] `JavaRequestBody`: type, description?
- [ ] `RepositoryAnalysis`: repo, endpoints[], hasExistingSwagger, swaggerUrl?
- [ ] `AppConfig`: orgUrl, teamPrefix (NO githubToken)
- [ ] `ParserResult`: status, message, data?, repositories?
- [ ] `OpenAPISpec`: openapi, info, servers?, tags?, paths, components?

---

## Phase 7: API Routes (30 min)

### Create `app/api/analyze/route.ts`
- [ ] Runtime: `export const runtime = 'nodejs'`
- [ ] `POST` handler:
  - [ ] Call `getServerSession(authOptions)` → check `session?.accessToken`
  - [ ] If no token: return 401 "Unauthorized"
  - [ ] Parse body: destructure `orgUrl, teamPrefix`
  - [ ] Validate both fields (return 400 if missing)
  - [ ] Extract org name from URL using regex: `/github\.com\/([^/]+)\/?$/`
  - [ ] Instantiate `GitHubClient(accessToken)`
  - [ ] Call `listRepositoriesByOrg(orgName, prefix)` → get repos
  - [ ] If no repos: return 404 "No repositories found"
  - [ ] For each repo:
    - [ ] Find Java controller files: `listFilesInDirectory(orgName, repo.name, 'src/main/java', '.*Controller\\.java$')`
    - [ ] For each file: `getFileContent()`, parse with `JavaControllerParser`
    - [ ] Collect endpoints
    - [ ] Push to `repositoryAnalyses`
  - [ ] Generate spec: `OpenAPIGenerator.generateFromRepositories(repositoryAnalyses, title)`
  - [ ] Return 200 with: `{ status: 'success', message, data: spec, repositories }`
  - [ ] Catch errors: return 500 with error message

---

## Phase 8: UI Components (40 min)

### Create `app/components/ConfigForm.tsx`
- [ ] `'use client'` directive
- [ ] Import: `useSession`, `signIn`, `signOut` from `next-auth/react`
- [ ] Props: `onSubmit(config)`, `isLoading`
- [ ] State: `config: AppConfig` (orgUrl, teamPrefix), load from localStorage on init
- [ ] If no session:
  - [ ] Show welcome message
  - [ ] GitHub sign-in button: calls `signIn('github')`
- [ ] If session:
  - [ ] Show user name + "Sign out" button
  - [ ] Form fields: Organization URL, Team Prefix
  - [ ] Save to localStorage on change
  - [ ] Submit button (disabled if loading)
  - [ ] Call `onSubmit(config)` on form submit

### Create `app/components/ResultsView.tsx`
- [ ] Props: `result: ParserResult`, `onNewAnalysis`
- [ ] If status === 'error': show error banner + "Try Again" button
- [ ] If status === 'success':
  - [ ] Success banner with message
  - [ ] Summary grid: repos with endpoint counts
  - [ ] Expandable sections per repo: list endpoints (method + path)
  - [ ] Download buttons: JSON, YAML
  - [ ] Copy-to-clipboard button
  - [ ] "New Analysis" button
- [ ] Helper functions:
  - [ ] `downloadSwagger()`: create blob, download as JSON
  - [ ] `downloadYAML()`: convert to YAML, download
  - [ ] `convertToYAML(obj, indent)`: recursive object-to-YAML converter
  - [ ] `getMethodColor(method)`: return CSS class (bg-blue, bg-green, etc)

---

## Phase 9: Main Page (20 min)

### Update `app/page.tsx`
- [ ] `'use client'` directive
- [ ] State: `result`, `isLoading`, `error`
- [ ] Function `handleAnalyze(config)`:
  - [ ] `setIsLoading(true)`
  - [ ] `POST /api/analyze` with config
  - [ ] Parse response
  - [ ] `setResult(data)`
  - [ ] Catch: `setError(msg)`
  - [ ] Finally: `setIsLoading(false)`
- [ ] Function `handleNewAnalysis()`: reset state
- [ ] Render:
  - [ ] Header: title + description
  - [ ] Conditional: `ConfigForm` (if no result) OR `ResultsView` (if result)
  - [ ] Info grid: 3 features (detection, multi-repo, formats)
  - [ ] Footer: version info + download repository button
    - [ ] Button `onClick`: `window.location.href = 'https://github.com/feliperafa/fb-swagger-generator/archive/refs/heads/master.zip'`

### Update `app/globals.css`
- [ ] Tailwind directives: `@tailwind base`, `@tailwind components`, `@tailwind utilities`

---

## Phase 10: Testing & Build (15 min)

- [ ] Local test:
  - [ ] `npm run dev` → http://localhost:3000
  - [ ] Click sign-in → GitHub OAuth flow
  - [ ] Fill org URL + prefix → analyze
  - [ ] Verify endpoints show
  - [ ] Download JSON/YAML
- [ ] Build test:
  - [ ] `npm run build` → should pass TypeScript check
  - [ ] No errors, warnings acceptable
- [ ] Env vars check:
  - [ ] `.env.local` has all 4 vars
  - [ ] `.env.example` documents them
  - [ ] `.env.local` in `.gitignore`

---

## Phase 11: Deployment (10 min)

- [ ] Push to GitHub (no `.env.local`)
- [ ] Create GitHub OAuth App (new callback URL for prod domain)
- [ ] Import repo into Vercel
- [ ] Set env vars in Vercel: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- [ ] Deploy
- [ ] Test OAuth flow in production

---

## 📊 Complexity by Component

| Component | Lines | Complexity | Notes |
|-----------|-------|-----------|-------|
| auth.ts | ~20 | Low | Straightforward NextAuth config |
| github.ts | ~80 | Medium | Error handling, API details |
| javaParser.ts | ~150 | High | Regex patterns for Java |
| openAPIGenerator.ts | ~100 | Medium | Path consolidation, type mapping |
| ConfigForm.tsx | ~100 | Low | Simple form + OAuth |
| ResultsView.tsx | ~200 | Medium | Expandable list, download logic |
| analyze/route.ts | ~120 | Medium | Orchestration, error handling |

**Total**: ~900 lines of application code (excluding comments, tests, config)

---

## 🎯 Most Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "NextAuth is not found" | Missing import in route | `import NextAuth from 'next-auth'` |
| "Cannot read property 'accessToken'" | Session not available in API route | Use `getServerSession(authOptions)` |
| "Unexpected token '<'" | GitHub API returning HTML (401/403) | Check error handling in `request()` method |
| "No repositories found" | Wrong org name or prefix | Verify org exists on GitHub, check capitalization |
| "Java parsing returns 0 endpoints" | Regex not matching | Check: `@RestController` exists, path patterns match |
| "Download button doesn't work" | Wrong repo owner/branch | Update repo URL in button: `https://github.com/{owner}/{repo}/archive/refs/heads/{branch}.zip` |

---

## ✅ Completion Checklist

- [ ] All 11 phases completed
- [ ] `npm run build` passes
- [ ] OAuth flow works locally
- [ ] Java parsing detects at least 1 endpoint
- [ ] OpenAPI spec exports as JSON/YAML
- [ ] Download buttons functional
- [ ] Deployed to Vercel
- [ ] Production OAuth tested

---

**Status**: Ready to hand off to replica AI  
**Version**: 1.0.0  
**Last updated**: 2026-05-07
