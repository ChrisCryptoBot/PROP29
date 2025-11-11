#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}`)
};

class ModuleValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.frontendPath = path.join(this.projectRoot, 'frontend');
    this.modulesPath = path.join(this.frontendPath, 'src/pages/modules');
    this.validationRules = {
      requiredFiles: ['index.tsx', 'manifest.json'],
      requiredExports: ['default'],
      maxFileSize: 100000, // 100KB
      maxComplexity: 10,
      namingConvention: /^[A-Z][a-zA-Z0-9]*$/,
      tsConfigCompliance: true,
      accessibilityCompliance: true,
      performanceCompliance: true
    };
  }

  async validateAll() {
    log.header('🔍 PROPER 2.9 Module Validation');
    log.info('Starting comprehensive module validation...\n');

    const results = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      modules: {},
      globalIssues: [],
      recommendations: []
    };

    try {
      // 1. Validate Module Structure
      log.section('📁 Module Structure Validation');
      const structureResults = await this.validateModuleStructure();
      results.modules = structureResults;

      // 2. Validate TypeScript Compliance
      log.section('📝 TypeScript Compliance');
      const tsResults = await this.validateTypeScriptCompliance();
      results.tsCompliance = tsResults;

      // 3. Validate Performance Standards
      log.section('⚡ Performance Standards');
      const perfResults = await this.validatePerformanceStandards();
      results.performanceCompliance = perfResults;

      // 4. Validate Accessibility
      log.section('♿ Accessibility Compliance');
      const a11yResults = await this.validateAccessibility();
      results.accessibilityCompliance = a11yResults;

      // 5. Validate Security
      log.section('🔒 Security Validation');
      const securityResults = await this.validateSecurity();
      results.securityCompliance = securityResults;

      // 6. Generate Summary
      log.section(' Validation Summary');
      results.summary = this.generateSummary(results);
      results.recommendations = this.generateRecommendations(results);

      // 7. Display Results
      this.displayResults(results);

      return results;

    } catch (error) {
      log.error(`Validation failed: ${error.message}`);
      throw error;
    }
  }

  async validateModuleStructure() {
    const modules = {};
    
    if (!fs.existsSync(this.modulesPath)) {
      log.error('Modules directory not found');
      return modules;
    }

    const moduleDirs = fs.readdirSync(this.modulesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    log.info(`Found ${moduleDirs.length} modules to validate`);

    for (const moduleName of moduleDirs) {
      const modulePath = path.join(this.modulesPath, moduleName);
      const validation = await this.validateModule(modulePath, moduleName);
      modules[moduleName] = validation;
    }

    return modules;
  }

  async validateModule(modulePath, moduleName) {
    const validation = {
      name: moduleName,
      passed: true,
      errors: [],
      warnings: [],
      checks: {}
    };

    try {
      // Check required files
      validation.checks.files = this.checkRequiredFiles(modulePath);
      if (!validation.checks.files.passed) {
        validation.passed = false;
        validation.errors.push(...validation.checks.files.errors);
      }

      // Check naming convention
      validation.checks.naming = this.checkNamingConvention(moduleName);
      if (!validation.checks.naming.passed) {
        validation.passed = false;
        validation.errors.push(...validation.checks.naming.errors);
      }

      // Check file sizes
      validation.checks.fileSizes = this.checkFileSizes(modulePath);
      if (validation.checks.fileSizes.warnings.length > 0) {
        validation.warnings.push(...validation.checks.fileSizes.warnings);
      }

      // Check TypeScript compliance
      validation.checks.typescript = await this.checkTypeScriptCompliance(modulePath);
      if (!validation.checks.typescript.passed) {
        validation.passed = false;
        validation.errors.push(...validation.checks.typescript.errors);
      }

      // Check component structure
      validation.checks.components = this.checkComponentStructure(modulePath);
      if (validation.checks.components.warnings.length > 0) {
        validation.warnings.push(...validation.checks.components.warnings);
      }

      // Check imports and dependencies
      validation.checks.dependencies = this.checkDependencies(modulePath);
      if (validation.checks.dependencies.warnings.length > 0) {
        validation.warnings.push(...validation.checks.dependencies.warnings);
      }

      const status = validation.passed ? 'PASSED' : 'FAILED';
      const color = validation.passed ? colors.green : colors.red;
      log.info(`${color}${moduleName}: ${status}${colors.reset}`);

    } catch (error) {
      validation.passed = false;
      validation.errors.push(`Validation error: ${error.message}`);
      log.error(`Failed to validate ${moduleName}: ${error.message}`);
    }

    return validation;
  }

  checkRequiredFiles(modulePath) {
    const result = { passed: true, errors: [], files: {} };
    const requiredFiles = ['index.tsx', 'manifest.json'];

    requiredFiles.forEach(file => {
      const filePath = path.join(modulePath, file);
      const exists = fs.existsSync(filePath);
      result.files[file] = exists;
      
      if (!exists) {
        result.passed = false;
        result.errors.push(`Missing required file: ${file}`);
      }
    });

    return result;
  }

  checkNamingConvention(moduleName) {
    const result = { passed: true, errors: [] };
    
    if (!this.validationRules.namingConvention.test(moduleName)) {
      result.passed = false;
      result.errors.push(`Module name '${moduleName}' doesn't follow PascalCase convention`);
    }

    return result;
  }

  checkFileSizes(modulePath) {
    const result = { warnings: [] };
    const files = this.getFilesRecursively(modulePath);

    files.forEach(file => {
      const stats = fs.statSync(file);
      if (stats.size > this.validationRules.maxFileSize) {
        result.warnings.push(`Large file detected: ${path.basename(file)} (${this.formatBytes(stats.size)})`);
      }
    });

    return result;
  }

  async checkTypeScriptCompliance(modulePath) {
    const result = { passed: true, errors: [] };

    try {
      // Check if TypeScript compilation works
      const tsFiles = this.getFilesRecursively(modulePath)
        .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'));

      for (const file of tsFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Basic TypeScript syntax checks
        if (content.includes('any') && !content.includes('// @ts-ignore')) {
          result.warnings.push(`Usage of 'any' type in ${path.basename(file)}`);
        }

        if (content.includes('console.log') && !content.includes('// eslint-disable-next-line')) {
          result.warnings.push(`Console.log found in ${path.basename(file)}`);
        }
      }

    } catch (error) {
      result.passed = false;
      result.errors.push(`TypeScript check failed: ${error.message}`);
    }

    return result;
  }

  checkComponentStructure(modulePath) {
    const result = { warnings: [] };
    const indexFile = path.join(modulePath, 'index.tsx');

    if (fs.existsSync(indexFile)) {
      const content = fs.readFileSync(indexFile, 'utf8');
      
      // Check for proper exports
      if (!content.includes('export default')) {
        result.warnings.push('Missing default export in index.tsx');
      }

      // Check for proper imports
      if (!content.includes('import React')) {
        result.warnings.push('Missing React import');
      }

      // Check for error boundaries
      if (!content.includes('ErrorBoundary')) {
        result.warnings.push('Consider adding ErrorBoundary wrapper');
      }
    }

    return result;
  }

  checkDependencies(modulePath) {
    const result = { warnings: [] };
    const files = this.getFilesRecursively(modulePath)
      .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'));

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for relative imports
      const relativeImports = content.match(/import.*from\s+['"]\.\.?\/.*['"]/g);
      if (relativeImports && relativeImports.length > 5) {
        result.warnings.push(`Many relative imports in ${path.basename(file)}`);
      }

      // Check for unused imports
      const imports = content.match(/import\s+{([^}]+)}\s+from/g);
      if (imports) {
        // This is a simplified check - in practice you'd use a linter
        result.warnings.push(`Check for unused imports in ${path.basename(file)}`);
      }
    });

    return result;
  }

  async validateTypeScriptCompliance() {
    log.info('Running TypeScript compilation check...');

    try {
      // Try to compile TypeScript
      execSync('npx tsc --noEmit', { 
        cwd: this.frontendPath, 
        stdio: 'pipe' 
      });
      log.success('TypeScript compilation successful');
      return { passed: true, errors: [] };
    } catch (error) {
      log.error('TypeScript compilation failed');
      return { 
        passed: false, 
        errors: ['TypeScript compilation errors detected'] 
      };
    }
  }

  async validatePerformanceStandards() {
    log.info('Checking performance standards...');

    const results = {
      passed: true,
      warnings: [],
      checks: {}
    };

    // Check for performance anti-patterns
    const modulesPath = path.join(this.frontendPath, 'src/pages/modules');
    const files = this.getFilesRecursively(modulesPath)
      .filter(file => file.endsWith('.tsx'));

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for missing React.memo
      if (content.includes('function ') && content.includes('props') && !content.includes('React.memo')) {
        results.warnings.push(`Consider using React.memo in ${path.basename(file)}`);
      }

      // Check for missing useCallback/useMemo
      if (content.includes('useEffect') && content.includes('[]') && !content.includes('useCallback')) {
        results.warnings.push(`Consider using useCallback for dependencies in ${path.basename(file)}`);
      }
    });

    log.success('Performance standards check complete');
    return results;
  }

  async validateAccessibility() {
    log.info('Checking accessibility compliance...');

    const results = {
      passed: true,
      warnings: [],
      checks: {}
    };

    // Check for accessibility attributes
    const modulesPath = path.join(this.frontendPath, 'src/pages/modules');
    const files = this.getFilesRecursively(modulesPath)
      .filter(file => file.endsWith('.tsx'));

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for missing alt attributes
      if (content.includes('<img') && !content.includes('alt=')) {
        results.warnings.push(`Missing alt attribute in ${path.basename(file)}`);
      }

      // Check for missing aria labels
      if (content.includes('<button') && !content.includes('aria-label') && !content.includes('aria-labelledby')) {
        results.warnings.push(`Consider adding aria-label to button in ${path.basename(file)}`);
      }

      // Check for semantic HTML
      if (content.includes('<div') && content.includes('onClick') && !content.includes('role=')) {
        results.warnings.push(`Consider using semantic HTML or adding role in ${path.basename(file)}`);
      }
    });

    log.success('Accessibility check complete');
    return results;
  }

  async validateSecurity() {
    log.info('Checking security compliance...');

    const results = {
      passed: true,
      warnings: [],
      checks: {}
    };

    // Check for security vulnerabilities
    const modulesPath = path.join(this.frontendPath, 'src/pages/modules');
    const files = this.getFilesRecursively(modulesPath)
      .filter(file => file.endsWith('.tsx'));

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for dangerous innerHTML usage
      if (content.includes('dangerouslySetInnerHTML')) {
        results.warnings.push(`Dangerous innerHTML usage in ${path.basename(file)}`);
      }

      // Check for eval usage
      if (content.includes('eval(')) {
        results.passed = false;
        results.warnings.push(`Eval usage detected in ${path.basename(file)}`);
      }

      // Check for direct DOM manipulation
      if (content.includes('document.getElementById') || content.includes('document.querySelector')) {
        results.warnings.push(`Direct DOM manipulation in ${path.basename(file)}`);
      }
    });

    log.success('Security check complete');
    return results;
  }

  generateSummary(results) {
    const summary = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    };

    Object.values(results.modules).forEach(module => {
      summary.total++;
      if (module.passed) {
        summary.passed++;
      } else {
        summary.failed++;
      }
      summary.warnings += module.warnings.length;
    });

    return summary;
  }

  generateRecommendations(results) {
    const recommendations = [];

    // Module-specific recommendations
    Object.entries(results.modules).forEach(([moduleName, module]) => {
      if (!module.passed) {
        recommendations.push({
          module: moduleName,
          priority: 'high',
          message: `Fix ${module.errors.length} validation errors in ${moduleName}`,
          actions: module.errors
        });
      }

      if (module.warnings.length > 0) {
        recommendations.push({
          module: moduleName,
          priority: 'medium',
          message: `Address ${module.warnings.length} warnings in ${moduleName}`,
          actions: module.warnings
        });
      }
    });

    // Global recommendations
    if (results.summary.failed > 0) {
      recommendations.push({
        module: 'global',
        priority: 'high',
        message: 'Fix validation errors before deployment',
        actions: ['Run validation again after fixes']
      });
    }

    return recommendations;
  }

  displayResults(results) {
    log.header('📊 Module Validation Results');

    // Summary
    const { total, passed, failed, warnings } = results.summary;
    console.log(`${colors.bright}Total Modules: ${total}${colors.reset}`);
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${warnings}${colors.reset}`);

    // Failed modules
    if (failed > 0) {
      log.section('❌ Failed Modules');
      Object.entries(results.modules)
        .filter(([_, module]) => !module.passed)
        .forEach(([name, module]) => {
          console.log(`${colors.red}${name}:${colors.reset}`);
          module.errors.forEach(error => {
            console.log(`  - ${error}`);
          });
        });
    }

    // Top recommendations
    if (results.recommendations.length > 0) {
      log.section('🔧 Top Recommendations');
      results.recommendations
        .filter(rec => rec.priority === 'high')
        .slice(0, 3)
        .forEach(rec => {
          console.log(`${colors.yellow}• ${rec.message}${colors.reset}`);
        });
    }

    const overallStatus = failed === 0 ? 'PASSED' : 'FAILED';
    const statusColor = failed === 0 ? colors.green : colors.red;
    log.header(`${statusColor}Overall Status: ${overallStatus}${colors.reset}`);
  }

  getFilesRecursively(dir) {
    const files = [];
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI Interface
if (require.main === module) {
  const validator = new ModuleValidator();
  
  validator.validateAll()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      log.error(`Validation failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = ModuleValidator;
