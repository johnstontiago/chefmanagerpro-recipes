# ChefManager 🍽️

Sistema completo de gestão de fichas técnicas e livros de receitas.

## Stack
- **Frontend/Backend**: Next.js 16 (App Router)
- **Banco de dados**: PostgreSQL via Prisma ORM
- **Autenticação**: JWT (HttpOnly cookies)
- **Deploy**: Railway

---

## 🚀 Deploy no Railway

### 1. Push para seu GitHub
Faça o push deste código para o seu repositório GitHub.

### 2. Criar projeto no Railway
1. Acesse [railway.app](https://railway.app)
2. **New Project → Deploy from GitHub repo**
3. Selecione este repositório

### 3. Adicionar PostgreSQL
1. No projeto, clique **+ New → Database → PostgreSQL**
2. O Railway preenche `DATABASE_URL` automaticamente

### 4. Adicionar variáveis de ambiente
Em **Variables** do seu serviço:
```
JWT_SECRET=sua-chave-secreta-aqui
NODE_ENV=production
```

### 5. Após primeiro deploy - rodar migrations
No Railway CLI ou terminal da instância:
```bash
npm run db:setup
```

Credenciais do admin inicial:
- Email: admin@chefmanager.com
- Senha: Admin@123

⚠️ Altere a senha após o primeiro login!

---

## Perfis de Usuário

| Perfil | Permissões |
|--------|-----------|
| Usuário | Editar suas próprias fichas técnicas |
| Supervisor | Ver/editar todos os livros; gerenciar usuários |
| Superusuário | Acesso total; excluir livros, receitas e usuários |

---

## Desenvolvimento Local

```bash
npm install
cp .env.example .env.local
# Edite .env.local com sua DATABASE_URL
npm run db:setup
npm run dev
```
