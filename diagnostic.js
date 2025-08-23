#!/usr/bin/env node

/**
 * Quick Diagnostic Script
 * Identifies common errors without complex terminal output
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running Quick Diagnostic...\n');

// 1. Check environment file
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
    console.log('✅ .env.local exists');
    const envContent = fs.readFileSync(envFile, 'utf8');
    if (envContent.includes('NEXT_PUBLIC_WORLD_APP_ID')) {
        console.log('✅ WORLD_APP_ID configured');
    } else {
        console.log('❌ WORLD_APP_ID missing');
    }
} else {
    console.log('❌ .env.local missing');
}

// 2. Check package.json
try {
    const pkg = require('./package.json');
    console.log(`✅ package.json loaded (${Object.keys(pkg.dependencies).length} deps)`);
} catch (error) {
    console.log(`❌ package.json error: ${error.message}`);
}

// 3. Check key files
const keyFiles = [
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/lib/utils.ts',
    'src/components/ui/toast.tsx',
    'next.config.mjs',
    'tsconfig.json'
];

keyFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
    }
});

// 4. Check node_modules
if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules exists');
} else {
    console.log('❌ node_modules missing - run npm install');
}

// 5. Check for duplicate configs
const configs = ['next.config.js', 'next.config.ts', 'next.config.mjs'];
const foundConfigs = configs.filter(c => fs.existsSync(c));
if (foundConfigs.length > 1) {
    console.log(`⚠️  Multiple Next.js configs found: ${foundConfigs.join(', ')}`);
} else if (foundConfigs.length === 1) {
    console.log(`✅ Single Next.js config: ${foundConfigs[0]}`);
} else {
    console.log('❌ No Next.js config found');
}

console.log('\n🏁 Diagnostic complete!');