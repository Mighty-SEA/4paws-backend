# 🚀 4Paws Backend - Quick Reference

## 📦 Build Commands

```bash
# Build portable (production-ready)
pnpm build:zip

# Build only (no packaging)
pnpm build

# Development mode
pnpm start:dev
```

---

## 📂 Output Locations

- **Build folder:** `portable-build/` (1.1 MB)
- **ZIP archive:** `releases/4paws-backend-portable-YYYY-MM-DD.zip` (~340 KB)

---

## 🎯 What's Included

```
portable-build/
├── dist/                # Compiled TypeScript → JavaScript
├── prisma/              # Database schema + migrations
├── package.json         # Dependencies list
├── pnpm-lock.yaml       # Locked versions
├── .env.example         # Environment template
├── start.bat            # Windows launcher
├── start.sh             # Linux/Mac launcher
└── README.md            # Deployment guide
```

---

## 🚀 Deploy to Client

### Method 1: Extract & Run (Recommended)

```bash
# 1. Extract ZIP to client machine
# 2. Copy .env.example to .env
# 3. Edit .env (set DATABASE_URL)
# 4. Run:

# Windows:
start.bat

# Linux/Mac:
chmod +x start.sh
./start.sh
```

### Method 2: Manual Setup

```bash
# 1. Extract ZIP
# 2. Create .env file
# 3. Install dependencies
pnpm install --production

# 4. Generate Prisma Client
pnpm prisma generate

# 5. Run migrations
pnpm prisma migrate deploy

# 6. Start server
pnpm start:prod
```

---

## 🔧 Client Requirements

- **Node.js:** 18+ or 20+ LTS
- **pnpm:** Auto-installed on first run
- **PostgreSQL:** Database server running
- **Port 3000:** Must be available (or change in .env)

---

## 📝 Environment Variables (.env)

Required variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/4paws"

# Auth
JWT_SECRET="your-secret-key-minimum-32-characters"

# Server
PORT=3000
NODE_ENV=production
```

---

## 🔄 Update Workflow

When deploying new version:

```bash
# 1. Build new version on dev machine
pnpm build:zip

# 2. Copy new ZIP to client
# 3. Extract to NEW folder (keep old as backup)
# 4. Copy .env from old folder
# 5. Run start.bat/start.sh
#    → Auto-detects changes
#    → Reinstalls deps if needed
#    → Runs new migrations
```

---

## 📊 Size Comparison

| Type | Size | Use Case |
|------|------|----------|
| **Source Code** | ~200 KB | Development |
| **Compiled Build** | 1.1 MB | Deployment folder |
| **Compressed ZIP** | 340 KB | Transfer/distribution |
| **With node_modules** | ~150 MB | After installation |

---

## 🐛 Troubleshooting

### "dist/ folder not found"
```bash
# Build first
pnpm build
```

### "Port already in use"
```bash
# Windows: Find what's using port 3000
netstat -ano | findstr :3000

# Linux/Mac:
lsof -i :3000

# Or change PORT in .env
```

### "Database connection failed"
- Check DATABASE_URL in `.env`
- Verify PostgreSQL is running
- Test connection: `psql <your-database-url>`

### "Prisma Client not generated"
```bash
pnpm prisma generate
```

### "Migration errors"
```bash
# Check migration status
pnpm prisma migrate status

# Apply pending migrations
pnpm prisma migrate deploy

# Reset database (⚠️  destroys data!)
pnpm prisma migrate reset
```

---

## ⚡ Performance Tips

1. **Use pnpm** (not npm) for faster installs
2. **Enable Developer Mode** on Windows for symlink support
3. **Use PostgreSQL connection pooling** in production
4. **Set NODE_ENV=production** in .env

---

## 📧 Support

For detailed deployment guide, see `portable-build/README.md` inside the ZIP.

---

**Last Updated:** October 3, 2025  
**NestJS Version:** 11.0.1  
**Node Version:** 22.20.0

