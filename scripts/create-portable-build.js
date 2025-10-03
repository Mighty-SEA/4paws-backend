const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Config
const portableDir = 'portable-build';
const releasesDir = 'releases';
const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const zipFileName = `4paws-backend-portable-${timestamp}.zip`;

// Ensure clean state
if (fs.existsSync(portableDir)) {
  fs.rmSync(portableDir, { recursive: true });
}
fs.mkdirSync(portableDir, { recursive: true });

console.log('📦 Creating portable NestJS backend build...');
console.log('📋 Copying essential files...');

// Helper: Copy directory recursively with exclusions
function copyDir(src, dest, exclude = []) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Skipping ${src} (not found)`);
    return;
  }
  
  fs.mkdirSync(dest, { recursive: true });
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    // Skip excluded items
    if (exclude.some(excludeItem => item.includes(excludeItem))) {
      console.log(`⏭️  Skipping: ${item}`);
      continue;
    }
    
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy dist folder (compiled backend)
if (fs.existsSync('dist')) {
  copyDir('dist', path.join(portableDir, 'dist'));
  console.log('✅ Copied: dist/');
} else {
  console.log('⚠️  Warning: dist/ folder not found. Run "pnpm build" first!');
  process.exit(1);
}

// Copy prisma folder (schema, migrations, seed)
if (fs.existsSync('prisma')) {
  copyDir('prisma', path.join(portableDir, 'prisma'));
  console.log('✅ Copied: prisma/');
} else {
  console.log('⚠️  Warning: prisma/ folder not found!');
}

// Copy essential config files
const essentialFiles = [
  'package.json',
  'pnpm-lock.yaml',
  'nest-cli.json',
  'ecosystem.config.js'
];

for (const file of essentialFiles) {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(portableDir, file));
    console.log(`✅ Copied: ${file}`);
  } else {
    console.log(`⏭️  Skipping: ${file} (optional)`);
  }
}

// Copy .env.example if exists (not .env for security)
if (fs.existsSync('.env.example')) {
  fs.copyFileSync('.env.example', path.join(portableDir, '.env.example'));
  console.log('✅ Copied: .env.example');
}

// Read package.json to detect port
let defaultPort = '3000';
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const startCmd = pkg.scripts?.['start:prod'] || 'node dist/main';
  
  // Try to detect port from environment or default
  if (process.env.PORT) {
    defaultPort = process.env.PORT;
  }
  
  console.log('');
  console.log(`✅ Detected start command: ${startCmd}`);
  console.log(`✅ Default port: ${defaultPort}`);
} catch (err) {
  console.log('⚠️  Could not read package.json');
}

// Generate start.bat (Windows)
const startBat = `@echo off
echo 🚀 Starting portable NestJS backend...
echo.

REM Check if .env exists
if not exist ".env" (
  if exist ".env.example" (
    echo ⚠️  No .env file found!
    echo 💡 Copying .env.example to .env...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Edit .env and configure DATABASE_URL and other settings!
    echo.
    pause
    exit /b 1
  ) else (
    echo ❌ No .env or .env.example found!
    echo 💡 Create a .env file with DATABASE_URL and other configurations
    pause
    exit /b 1
  )
)

REM Smart dependency check
if not exist "node_modules" (
  echo 📦 First run - Installing dependencies with pnpm...
  echo ⏱️  This takes 2-5 minutes (one time only)
  echo.
  call pnpm install --production --ignore-scripts
  if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
  )
  
  echo.
  echo 🔧 Generating Prisma Client...
  call pnpm prisma generate
  if errorlevel 1 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
  )
) else (
  echo ✅ Dependencies already installed
  echo 💡 Tip: Delete node_modules if you need fresh install
  echo.
)

REM Check database migrations
echo 🔍 Checking database migrations...
call pnpm prisma migrate deploy
if errorlevel 1 (
  echo ⚠️  Warning: Migration check failed
  echo 💡 Make sure DATABASE_URL in .env is correct
  echo.
)

REM Read PORT from .env if exists
set APP_PORT=${defaultPort}
if exist ".env" (
  for /f "tokens=2 delims==" %%a in ('findstr /r "^PORT=" .env') do set APP_PORT=%%a
)

REM Start the backend
echo ========================================
echo 🎯 Starting NestJS backend...
echo 🌐 API: http://localhost:%APP_PORT%
echo ⏹️  Press Ctrl+C to stop the server
echo ========================================
echo.
node dist/src/main.js
if errorlevel 1 (
  echo.
  echo ❌ Failed to start the backend
  echo 💡 Check if port ${defaultPort} is available
  echo 💡 Check DATABASE_URL in .env
  pause
  exit /b 1
)
`;

fs.writeFileSync(path.join(portableDir, 'start.bat'), startBat);
console.log('✅ Generated: start.bat');

// Generate start.sh (Linux/Mac)
const startSh = `#!/bin/bash
# Portable NestJS Backend Starter
echo "🚀 Starting portable NestJS backend..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "⚠️  No .env file found!"
    echo "💡 Copying .env.example to .env..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and configure DATABASE_URL and other settings!"
    echo ""
    exit 1
  else
    echo "❌ No .env or .env.example found!"
    echo "💡 Create a .env file with DATABASE_URL and other configurations"
    exit 1
  fi
fi

# Smart dependency check
if [ ! -d "node_modules" ]; then
  echo "📦 First run - Installing dependencies with pnpm..."
  echo "⏱️  This takes 2-5 minutes (one time only)"
  pnpm install --production --ignore-scripts
  
  echo ""
  echo "🔧 Generating Prisma Client..."
  pnpm prisma generate
elif [ "package.json" -nt "node_modules" ]; then
  echo "🔄 Dependencies changed - Updating..."
  pnpm install --production --ignore-scripts
  pnpm prisma generate
else
  echo "✅ Dependencies up to date"
fi
echo ""

# Check database migrations
echo "🔍 Checking database migrations..."
pnpm prisma migrate deploy
echo ""

# Read PORT from .env if exists
APP_PORT=${defaultPort}
if [ -f ".env" ]; then
  PORT_LINE=$(grep "^PORT=" .env)
  if [ ! -z "$PORT_LINE" ]; then
    APP_PORT=$(echo $PORT_LINE | cut -d'=' -f2)
  fi
fi

# Start the backend
echo "========================================"
echo "🎯 Starting NestJS backend..."
echo "🌐 API: http://localhost:$APP_PORT"
echo "⏹️  Press Ctrl+C to stop the server"
echo "========================================"
echo ""
node dist/src/main.js
`;

fs.writeFileSync(path.join(portableDir, 'start.sh'), startSh);
fs.chmodSync(path.join(portableDir, 'start.sh'), '755');
console.log('✅ Generated: start.sh');

// Generate README
const readme = `# 4Paws Backend - Portable Build

## 📦 Quick Start

### Windows
\`\`\`bash
start.bat
\`\`\`

### Linux/Mac
\`\`\`bash
chmod +x start.sh
./start.sh
\`\`\`

---

## 🔧 Configuration

### 1. Database Setup

Create \`.env\` file (or copy from \`.env.example\`):

\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/4paws"
JWT_SECRET="your-secret-key-here"
PORT=${defaultPort}
\`\`\`

### 2. Database Migrations

First run will automatically:
- Install dependencies
- Generate Prisma Client
- Apply database migrations

### 3. Manual Migration (if needed)

\`\`\`bash
pnpm prisma migrate deploy
\`\`\`

### 4. Seed Database (optional)

\`\`\`bash
pnpm prisma db seed
\`\`\`

---

## 📝 Requirements

- Node.js 18+ or 20+
- pnpm (will be installed if missing)
- PostgreSQL database

---

## 🚀 Production Deployment

This portable build is ready for production:
1. ✅ Compiled TypeScript → JavaScript
2. ✅ Production dependencies only
3. ✅ Database migrations included
4. ✅ Auto-install dependencies on first run

---

## 🔄 Updating

When deploying a new version:
1. Extract new ZIP
2. Delete old \`node_modules\` (optional)
3. Copy your \`.env\` file
4. Run \`start.bat\` or \`start.sh\`

The script will detect changes and reinstall dependencies automatically.

---

## ❓ Troubleshooting

### Port already in use
\`\`\`bash
# Check what's using port ${defaultPort}
netstat -ano | findstr :${defaultPort}  # Windows
lsof -i :${defaultPort}                  # Linux/Mac
\`\`\`

### Database connection error
- Check DATABASE_URL in \`.env\`
- Ensure PostgreSQL is running
- Verify database exists

### Prisma errors
\`\`\`bash
# Regenerate Prisma Client
pnpm prisma generate

# Reset database (⚠️  destroys data!)
pnpm prisma migrate reset
\`\`\`

---

## 📊 Build Info

- Build date: ${new Date().toLocaleString()}
- Platform: Windows + Linux/Mac support
- Node version required: 18+

---

## 📧 Support

For issues or questions, contact your development team.
`;

fs.writeFileSync(path.join(portableDir, 'README.md'), readme);
console.log('✅ Generated: README.md');

// Create releases directory
if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
  console.log(`✅ Created releases directory: ${releasesDir}/`);
}

// Create ZIP archive
console.log('');
console.log('🗜️  Creating compressed archive...');

const outputPath = path.join(releasesDir, zipFileName);
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', { 
  zlib: { level: 6 } // Balanced compression
});

output.on('close', () => {
  const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  const folderSize = getFolderSize(portableDir);
  const folderSizeMB = (folderSize / 1024 / 1024).toFixed(2);
  const compressionRatio = (((folderSize - archive.pointer()) / folderSize) * 100).toFixed(0);
  
  console.log('');
  console.log('✅ Portable build created successfully!');
  console.log('');
  console.log('📂 Build Output:');
  console.log(`   Folder:  ${portableDir}/ (${folderSizeMB} MB)`);
  console.log(`   Archive: ${outputPath}`);
  console.log(`   Size:    ${sizeMB} MB`);
  console.log(`   Ratio:   ${compressionRatio}% compressed`);
  console.log('');
  console.log('🚀 To deploy:');
  console.log(`   1. Copy ${outputPath} to target server`);
  console.log('   2. Extract the ZIP');
  console.log('   3. Create .env file with DATABASE_URL');
  console.log('   4. Run: start.bat (Windows) or ./start.sh (Linux/Mac)');
  console.log(`   5. Access API: http://localhost:${defaultPort}`);
  console.log('');
  console.log('💡 First run: Auto-install dependencies + Prisma setup (2-5 min one time)');
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.log('⚠️  Warning:', err.message);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  console.log('⚠️  Error creating archive:', err.message);
});

archive.pipe(output);

// Use directory method (efficient, handles file limits)
archive.directory(portableDir, false);
archive.finalize();

// Helper: Calculate folder size
function getFolderSize(dirPath) {
  let size = 0;
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      size += getFolderSize(filePath);
    } else {
      size += stat.size;
    }
  }
  
  return size;
}

