#!/usr/bin/env node

/**
 * AI Update Assistant for PROPER 2.9
 * Helps validate and guide AI-assisted updates to ensure they follow the modular architecture
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AIUpdateAssistant {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.modulesDir = path.join(this.projectRoot, 'modules');
    this.sharedDir = path.join(this.projectRoot, 'shared');
    this.appDir = path.join(this.projectRoot, 'app');
  }

  /**
   * Analyze a proposed update and provide guidance
   */
  analyzeUpdate(updateDescription) {
    console.log('🤖 AI Update Assistant - Analyzing Update\n');
    
    const analysis = {
      moduleImpact: this.identifyModuleImpact(updateDescription),
      fileChanges: this.predictFileChanges(updateDescription),
      validationChecks: this.generateValidationChecks(updateDescription),
      recommendations: this.generateRecommendations(updateDescription),
      rollbackPlan: this.generateRollbackPlan(updateDescription)
    };

    this.printAnalysis(analysis);
    return analysis;
  }

  /**
   * Validate that changes follow the modular architecture
   */
  validateChanges(changedFiles) {
    console.log('🔍 Validating Changes Against Modular Architecture\n');
    
    const violations = [];
    const warnings = [];

    changedFiles.forEach(file => {
      // Check for cross-module imports
      if (this.hasCrossModuleImports(file)) {
        violations.push(`Cross-module import detected in ${file}`);
      }

      // Check for absolute import usage
      if (!this.usesAbsoluteImports(file)) {
        warnings.push(`Consider using absolute imports in ${file}`);
      }

      // Check file location matches purpose
      if (!this.fileLocationMatchesPurpose(file)) {
        violations.push(`File ${file} is in incorrect location for its purpose`);
      }

      // Check naming conventions
      if (!this.followsNamingConventions(file)) {
        warnings.push(`File ${file} doesn't follow naming conventions`);
      }
    });

    this.printValidationResults(violations, warnings);
    return { violations, warnings };
  }

  /**
   * Generate update instructions for AI
   */
  generateAIInstructions(updateRequest) {
    const instructions = {
      context: this.buildContext(updateRequest),
      constraints: this.buildConstraints(updateRequest),
      patterns: this.buildPatterns(updateRequest),
      examples: this.buildExamples(updateRequest),
      validation: this.buildValidationRules(updateRequest)
    };

    console.log('📋 AI Update Instructions Generated\n');
    console.log(JSON.stringify(instructions, null, 2));
    
    return instructions;
  }

  /**
   * Create a module update template
   */
  createModuleUpdateTemplate(moduleName, updateType) {
    const template = {
      moduleName,
      updateType,
      filesToModify: this.getModuleFiles(moduleName),
      newFiles: this.suggestNewFiles(moduleName, updateType),
      testsToUpdate: this.identifyTestsToUpdate(moduleName),
      documentationUpdates: this.identifyDocumentationUpdates(moduleName)
    };

    const templatePath = path.join(this.projectRoot, 'temp', `update-${moduleName}-${Date.now()}.json`);
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
    
    console.log(`📝 Update template created: ${templatePath}`);
    return template;
  }

  /**
   * Pre-flight check before applying changes
   */
  preflightCheck(changes) {
    console.log('✈️ Pre-flight Check\n');
    
    const checks = [
      this.checkModuleIsolation(changes),
      this.checkTypeSafety(changes),
      this.checkTestCoverage(changes),
      this.checkPerformanceImpact(changes),
      this.checkBreakingChanges(changes)
    ];

    const allPassed = checks.every(check => check.passed);
    
    console.log(`\n${allPassed ? '✅' : '❌'} Pre-flight check ${allPassed ? 'PASSED' : 'FAILED'}`);
    
    return { passed: allPassed, checks };
  }

  // Helper methods
  identifyModuleImpact(description) {
    const modules = this.getAvailableModules();
    const impacted = modules.filter(module => 
      description.toLowerCase().includes(module.toLowerCase())
    );
    
    return {
      primary: impacted[0] || null,
      secondary: impacted.slice(1),
      shared: this.identifySharedImpact(description)
    };
  }

  predictFileChanges(description) {
    const changes = [];
    
    // Predict based on common patterns
    if (description.includes('modal')) {
      changes.push('modals/');
    }
    if (description.includes('tab')) {
      changes.push('tabs/');
    }
    if (description.includes('hook')) {
      changes.push('hooks/');
    }
    if (description.includes('service')) {
      changes.push('services/');
    }
    if (description.includes('type')) {
      changes.push('types/');
    }
    
    return changes;
  }

  generateValidationChecks(description) {
    return [
      'Ensure no cross-module imports',
      'Use absolute imports for shared code',
      'Follow naming conventions',
      'Update module manifest if needed',
      'Add/update tests',
      'Update documentation'
    ];
  }

  generateRecommendations(description) {
    const recommendations = [];
    
    if (description.includes('new feature')) {
      recommendations.push('Consider creating a new module if feature is substantial');
      recommendations.push('Update module manifest with new routes/permissions');
    }
    
    if (description.includes('UI')) {
      recommendations.push('Use shared UI components when possible');
      recommendations.push('Follow design system tokens');
    }
    
    if (description.includes('API')) {
      recommendations.push('Use module-specific API client');
      recommendations.push('Implement proper error handling');
    }
    
    return recommendations;
  }

  generateRollbackPlan(description) {
    return [
      'Create git branch before changes',
      'Document current state',
      'Identify critical files to backup',
      'Plan rollback sequence',
      'Test rollback procedure'
    ];
  }

  hasCrossModuleImports(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
      const matches = [...content.matchAll(importRegex)];
      
      return matches.some(match => {
        const importPath = match[1];
        return importPath.includes('../modules/') && !importPath.includes('@shared/');
      });
    } catch (error) {
      return false;
    }
  }

  usesAbsoluteImports(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
      const matches = [...content.matchAll(importRegex)];
      
      return matches.every(match => {
        const importPath = match[1];
        return importPath.startsWith('@') || importPath.startsWith('.');
      });
    } catch (error) {
      return true;
    }
  }

  fileLocationMatchesPurpose(filePath) {
    const fileName = path.basename(filePath);
    
    if (fileName.endsWith('.test.tsx') && !filePath.includes('__tests__')) {
      return false;
    }
    
    if (fileName.endsWith('.types.ts') && !filePath.includes('types/')) {
      return false;
    }
    
    if (fileName.startsWith('use') && !filePath.includes('hooks/')) {
      return false;
    }
    
    return true;
  }

  followsNamingConventions(filePath) {
    const fileName = path.basename(filePath);
    
    // Component files should be PascalCase
    if (fileName.endsWith('.tsx') && !fileName.match(/^[A-Z][a-zA-Z]*\.tsx$/)) {
      return false;
    }
    
    // Hook files should start with 'use'
    if (fileName.includes('use') && !fileName.match(/^use[A-Z][a-zA-Z]*\.ts$/)) {
      return false;
    }
    
    return true;
  }

  getAvailableModules() {
    if (!fs.existsSync(this.modulesDir)) {
      return [];
    }
    
    return fs.readdirSync(this.modulesDir)
      .filter(name => !name.startsWith('_'))
      .filter(name => fs.statSync(path.join(this.modulesDir, name)).isDirectory());
  }

  printAnalysis(analysis) {
    console.log('📊 Update Analysis Results:\n');
    
    console.log('🎯 Module Impact:');
    console.log(`  Primary: ${analysis.moduleImpact.primary || 'None'}`);
    console.log(`  Secondary: ${analysis.moduleImpact.secondary.join(', ') || 'None'}`);
    console.log(`  Shared: ${analysis.moduleImpact.shared.join(', ') || 'None'}`);
    
    console.log('\n📁 Predicted File Changes:');
    analysis.fileChanges.forEach(change => console.log(`  - ${change}`));
    
    console.log('\n✅ Validation Checks:');
    analysis.validationChecks.forEach(check => console.log(`  - ${check}`));
    
    console.log('\n💡 Recommendations:');
    analysis.recommendations.forEach(rec => console.log(`  - ${rec}`));
    
    console.log('\n🔄 Rollback Plan:');
    analysis.rollbackPlan.forEach(step => console.log(`  - ${step}`));
  }

  printValidationResults(violations, warnings) {
    if (violations.length > 0) {
      console.log('❌ Architecture Violations:');
      violations.forEach(violation => console.log(`  - ${violation}`));
    }
    
    if (warnings.length > 0) {
      console.log('⚠️  Warnings:');
      warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (violations.length === 0 && warnings.length === 0) {
      console.log('✅ All changes follow the modular architecture!');
    }
  }

  checkModuleIsolation(changes) {
    const hasCrossModuleImports = changes.some(file => this.hasCrossModuleImports(file));
    return {
      name: 'Module Isolation',
      passed: !hasCrossModuleImports,
      message: hasCrossModuleImports ? 'Cross-module imports detected' : 'Module isolation maintained'
    };
  }

  checkTypeSafety(changes) {
    const hasTypeFiles = changes.some(file => file.includes('.types.ts'));
    return {
      name: 'Type Safety',
      passed: hasTypeFiles,
      message: hasTypeFiles ? 'Type definitions included' : 'Consider adding type definitions'
    };
  }

  checkTestCoverage(changes) {
    const hasTestFiles = changes.some(file => file.includes('.test.'));
    return {
      name: 'Test Coverage',
      passed: hasTestFiles,
      message: hasTestFiles ? 'Tests included' : 'Consider adding tests'
    };
  }

  checkPerformanceImpact(changes) {
    const hasLargeFiles = changes.some(file => {
      try {
        const stats = fs.statSync(file);
        return stats.size > 10000; // 10KB threshold
      } catch {
        return false;
      }
    });
    
    return {
      name: 'Performance Impact',
      passed: !hasLargeFiles,
      message: hasLargeFiles ? 'Large files detected - consider splitting' : 'Performance impact minimal'
    };
  }

  checkBreakingChanges(changes) {
    const hasBreakingChanges = changes.some(file => 
      file.includes('manifest.ts') || file.includes('index.ts')
    );
    
    return {
      name: 'Breaking Changes',
      passed: !hasBreakingChanges,
      message: hasBreakingChanges ? 'Breaking changes detected' : 'No breaking changes'
    };
  }
}

// CLI Interface
if (require.main === module) {
  const assistant = new AIUpdateAssistant();
  const command = process.argv[2];
  
  switch (command) {
    case 'analyze':
      const description = process.argv[3];
      if (!description) {
        console.error('Please provide an update description');
        process.exit(1);
      }
      assistant.analyzeUpdate(description);
      break;
      
    case 'validate':
      const files = process.argv.slice(3);
      if (files.length === 0) {
        console.error('Please provide files to validate');
        process.exit(1);
      }
      assistant.validateChanges(files);
      break;
      
    case 'template':
      const moduleName = process.argv[3];
      const updateType = process.argv[4];
      if (!moduleName || !updateType) {
        console.error('Please provide module name and update type');
        process.exit(1);
      }
      assistant.createModuleUpdateTemplate(moduleName, updateType);
      break;
      
    case 'preflight':
      const changeFiles = process.argv.slice(3);
      if (changeFiles.length === 0) {
        console.error('Please provide files for preflight check');
        process.exit(1);
      }
      assistant.preflightCheck(changeFiles);
      break;
      
    default:
      console.log(`
🤖 AI Update Assistant for PROPER 2.9

Usage:
  node ai-update-assistant.js analyze "update description"
  node ai-update-assistant.js validate file1.tsx file2.ts
  node ai-update-assistant.js template ModuleName feature
  node ai-update-assistant.js preflight file1.tsx file2.ts

Examples:
  node ai-update-assistant.js analyze "Add new modal to AccessControl module"
  node ai-update-assistant.js validate src/modules/AccessControl/Modals.tsx
      `);
  }
}

module.exports = AIUpdateAssistant; 