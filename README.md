# Rede Social — Projeto Final EBAC

Projeto final do curso de back-end da EBAC: uma rede social simples com cadastro/login,
edição de perfil, sistema de seguir usuários, feed de postagens (só de quem você segue),
curtidas e comentários.

## Stack

- **Back-end**: Django + Django REST Framework, autenticação via JWT
  (`djangorestframework-simplejwt`)
- **Front-end**: React + Vite + TypeScript, shadcn/ui + Tailwind CSS, TanStack Query,
  React Router, react-hook-form + zod
- **Banco de dados**: PostgreSQL (Supabase)
- **Armazenamento de fotos de perfil**: Supabase Storage
- **Deploy**: Render (back-end) + Vercel (front-end)
- **CI**: GitHub Actions (testes do back-end + lint/build do front-end)

## Link do deploy

- Front-end: `<preencher após o deploy no Vercel>`
- Back-end (API): `<preencher após o deploy no Render>`

> O back-end roda no plano gratuito do Render, que "dorme" após um período de
> inatividade. Na primeira requisição após esse período, a API pode levar até ~50
> segundos para responder — o front-end mostra um aviso e tenta novamente
> automaticamente nesse caso.

## Estrutura do repositório

```
projeto-final/
  backend/    # Django REST Framework
  frontend/   # React (Vite) + shadcn/ui + Tailwind
  .github/workflows/ci.yml
```

## Rodando localmente

### Pré-requisitos

- Python 3.11+
- Node.js 20+ e npm
- Uma conta no [Supabase](https://supabase.com) (gratuita) — necessária apenas se quiser
  testar o upload de foto de perfil ou usar Postgres em vez de SQLite localmente

### Back-end

```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows (Git Bash) — no Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver 8000
```

Por padrão (`.env` sem `DATABASE_URL`), o back-end usa SQLite local — não precisa de
Supabase para rodar. Para usar Postgres do Supabase, preencha `DATABASE_URL` no `.env`
com a connection string do projeto.

Para testar o upload de foto de perfil, crie um bucket público no Supabase Storage e
preencha `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` e `SUPABASE_BUCKET` no `.env`.

Rodar os testes:

```bash
python manage.py test
```

### Front-end

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Acesse `http://localhost:5173`. Por padrão ele aponta para o back-end em
`http://localhost:8000/api` (configurável via `VITE_API_URL`).

## Variáveis de ambiente

### `backend/.env`

| Variável | Descrição |
|---|---|
| `SECRET_KEY` | Chave secreta do Django |
| `DEBUG` | `True` em desenvolvimento, `False` em produção |
| `ALLOWED_HOSTS` | Domínios permitidos, separados por vírgula |
| `DATABASE_URL` | Connection string do Postgres (Supabase). Vazio = usa SQLite |
| `CORS_ALLOWED_ORIGINS` | Origem(s) do front-end permitidas pelo CORS |
| `SUPABASE_URL` | URL do projeto Supabase (para upload de fotos) |
| `SUPABASE_SERVICE_KEY` | Service role key do Supabase |
| `SUPABASE_BUCKET` | Nome do bucket de Storage para fotos de perfil |

### `frontend/.env.local`

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base da API do back-end (ex: `http://localhost:8000/api`) |

## Deploy

### 1. Supabase (banco + storage)

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Em **Project Settings → Database**, copie a connection string (modo "Session
   pooler" ou "Transaction pooler") para usar como `DATABASE_URL`
3. Em **Storage**, crie um bucket público (ex: `profile-photos`) e gere uma
   **service role key** em **Project Settings → API** para usar como
   `SUPABASE_SERVICE_KEY`

### 2. Back-end no Render

1. Crie um **Web Service** apontando para este repositório, com **Root Directory** =
   `backend`
2. **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
3. **Start Command**: `gunicorn core.wsgi`
4. Configure as variáveis de ambiente da tabela acima (`DEBUG=False`,
   `ALLOWED_HOSTS` com o domínio `.onrender.com`, `DATABASE_URL` do Supabase,
   `CORS_ALLOWED_ORIGINS` com a URL do Vercel, etc.)

### 3. Front-end no Vercel

1. Importe este repositório no Vercel com **Root Directory** = `frontend`
   (framework detectado automaticamente como Vite)
2. Configure a variável de ambiente `VITE_API_URL` apontando para a URL pública do
   back-end no Render (ex: `https://seu-app.onrender.com/api`)

### 4. CI/CD

- O workflow em `.github/workflows/ci.yml` roda os testes do back-end e o
  lint/build do front-end a cada push/PR para `main`
- Render e Vercel fazem redeploy automático a cada push em `main`, cada um observando
  apenas a sua pasta (`backend/` ou `frontend/`)
