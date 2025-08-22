#!/usr/bin/env node

/**
 * Build Validation Script
 * Mimics Vercel's deployment pipeline with comprehensive checks
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BuildValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✓',
      warn: '⚠',
      error: '✗',
      step: '→'
    }[type] || 'ℹ';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, description, options = {}) {
    this.log(`${description}...`, 'step');
    
    try {
      const result = execSync(command, {
        stdio: options.silent ? 'pipe' : 'inherit',
        encoding: 'utf8',
        cwd: process.cwd(),
        ...options
      });
      
      this.log(`${description} completed successfully`);
      return result;
    } catch (error) {
      const message = `${description} failed: ${error.message}`;
      
      if (options.allowFailure) {
        this.warnings.push(message);
        this.log(message, 'warn');
        return null;
      } else {
        this.errors.push(message);
        this.log(message, 'error');
        throw error;
      }
    }
  }

  async checkEnvironment() {
    this.log('Checking environment...', 'step');
    
    // Check Node.js version
    const nodeVersion = process.version;
    this.log(`Node.js version: ${nodeVersion}`);
    
    // Check if package.json exists
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found');
    }
    
    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
      this.log('node_modules not found, installing dependencies...', 'warn');
      await this.runCommand('npm ci', 'Installing dependencies');
    }
    
    this.log('Environment check completed');
  }

  async validateCode() {
    this.log('Starting code validation...', 'step');
    
    // TypeScript type checking
    await this.runCommand('npm run type-check', 'TypeScript type checking');
    
    // ESLint
    await this.runCommand('npm run lint', 'ESLint validation');
    
    // Unit tests
    await this.runCommand('npm run test', 'Running unit tests', { 
      env: { ...process.env, CI: 'true' } 
    });
    
    this.log('Code validation completed');
  }

  async buildApplication() {
    this.log('Building application...', 'step');
    
    // Clean previous build
    if (fs.existsSync('.next')) {
      this.log('Cleaning previous build...');
      fs.rmSync('.next', { recursive: true, force: true });
    }
    
    // Build the application
    await this.runCommand('npm run build', 'Building Next.js application', {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1'
      }
    });
    
    // Verify build output
    this.verifyBuildOutput();
    
    this.log('Application build completed');
  }

  verifyBuildOutput() {
    this.log('Verifying build output...', 'step');
    
    const buildDir = '.next';
    const requiredFiles = [
      '.next/BUILD_ID',
      '.next/static',
      '.next/server'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required build file missing: ${file}`);
      }
    }
    
    // Check build size
    const buildStats = this.getBuildStats();
    this.log(`Build size: ${buildStats.totalSize}MB`);
    
    if (buildStats.totalSize > 50) {
      this.warnings.push(`Build size is large: ${buildStats.totalSize}MB`);
    }
    
    this.log('Build output verification completed');
  }

  getBuildStats() {
    const buildDir = '.next';
    let totalSize = 0;
    
    function getDirectorySize(dir) {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    }
    
    if (fs.existsSync(buildDir)) {
      getDirectorySize(buildDir);
    }
    
    return {
      totalSize: Math.round(totalSize / 1024 / 1024 * 100) / 100
    };
  }

  async runSecurityChecks() {
    this.log('Running security checks...', 'step');
    
    // npm audit
    await this.runCommand(
      'npm audit --audit-level=high', 
      'npm security audit', 
      { allowFailure: true }
    );
    
    this.log('Security checks completed');
  }

  generateReport() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    
    this.log('\n=== BUILD VALIDATION REPORT ===');
    this.log(`Duration: ${duration}s`);
    this.log(`Errors: ${this.errors.length}`);
    this.log(`Warnings: ${this.warnings.length}`);
    
    if (this.warnings.length > 0) {
      this.log('\nWarnings:');
      this.warnings.forEach(warning => this.log(`  - ${warning}`, 'warn'));
    }
    
    if (this.errors.length > 0) {
      this.log('\nErrors:');
      this.errors.forEach(error => this.log(`  - ${error}`, 'error'));
      this.log('\nBuild validation FAILED', 'error');
      process.exit(1);
    } else {
      this.log('\nBuild validation PASSED', 'info');
    }
  }

  async run() {
    try {
      this.log('Starting build validation pipeline...');
      
      await this.checkEnvironment();
      await this.validateCode();
      await this.buildApplication();
      await this.runSecurityChecks();
      
      this.generateReport();
    } catch (error) {
      this.log(`Build validation failed: ${error.message}`, 'error');
      this.generateReport();
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new BuildValidator();
  validator.run();
}

export default BuildValidator;