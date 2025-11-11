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

class PerformanceAuditor {
  constructor() {
    this.projectRoot = process.cwd();
    this.frontendPath = path.join(this.projectRoot, 'frontend');
    this.reportPath = path.join(this.projectRoot, 'performance-report.json');
    this.thresholds = {
      bundleSize: 500000, // 500KB
      loadTime: 3000, // 3 seconds
      renderTime: 100, // 100ms
      memoryUsage: 50000000, // 50MB
      errorRate: 0.05 // 5%
    };
  }

  async runAudit() {
    log.header('🚀 PROPER 2.9 Performance Audit');
    log.info('Starting comprehensive performance analysis...\n');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {},
      modules: {},
      recommendations: [],
      issues: []
    };

    try {
      // 1. Bundle Analysis
      log.section('📦 Bundle Analysis');
      const bundleAnalysis = await this.analyzeBundle();
      report.bundleAnalysis = bundleAnalysis;

      // 2. Module Performance
      log.section(' Module Performance Analysis');
      const moduleAnalysis = await this.analyzeModules();
      report.modules = moduleAnalysis;

      // 3. Memory Usage
      log.section('💾 Memory Usage Analysis');
      const memoryAnalysis = await this.analyzeMemoryUsage();
      report.memoryAnalysis = memoryAnalysis;

      // 4. API Performance
      log.section('🌐 API Performance Analysis');
      const apiAnalysis = await this.analyzeApiPerformance();
      report.apiAnalysis = apiAnalysis;

      // 5. Generate Summary
      log.section('📊 Performance Summary');
      report.summary = this.generateSummary(report);
      report.recommendations = this.generateRecommendations(report);
      report.issues = this.identifyIssues(report);

      // 6. Save Report
      this.saveReport(report);

      // 7. Display Results
      this.displayResults(report);

      return report;

    } catch (error) {
      log.error(`Audit failed: ${error.message}`);
      throw error;
    }
  }

  async analyzeBundle() {
    log.info('Analyzing bundle sizes...');

    try {
      // Run webpack bundle analyzer if available
      if (fs.existsSync(path.join(this.frontendPath, 'node_modules/.bin/webpack-bundle-analyzer'))) {
        execSync('npm run build:analyze', { cwd: this.frontendPath, stdio: 'pipe' });
      }

      // Analyze build output
      const buildPath = path.join(this.frontendPath, 'build');
      if (fs.existsSync(buildPath)) {
        const files = this.getFilesRecursively(buildPath);
        const bundleSizes = files
          .filter(file => file.endsWith('.js') || file.endsWith('.css'))
          .map(file => ({
            name: path.basename(file),
            size: fs.statSync(file).size,
            path: file
          }))
          .sort((a, b) => b.size - a.size);

        const totalSize = bundleSizes.reduce((sum, file) => sum + file.size, 0);
        const largeFiles = bundleSizes.filter(file => file.size > this.thresholds.bundleSize);

        log.success(`Total bundle size: ${this.formatBytes(totalSize)}`);
        if (largeFiles.length > 0) {
          log.warn(`Found ${largeFiles.length} large files:`);
          largeFiles.forEach(file => {
            log.warn(`  - ${file.name}: ${this.formatBytes(file.size)}`);
          });
        }

        return {
          totalSize,
          fileCount: bundleSizes.length,
          largeFiles,
          averageFileSize: totalSize / bundleSizes.length
        };
      }

      return { error: 'Build directory not found' };

    } catch (error) {
      log.error(`Bundle analysis failed: ${error.message}`);
      return { error: error.message };
    }
  }

  async analyzeModules() {
    log.info('Analyzing module performance...');

    const modulesPath = path.join(this.frontendPath, 'src/pages/modules');
    const modules = {};

    if (fs.existsSync(modulesPath)) {
      const moduleDirs = fs.readdirSync(modulesPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const moduleName of moduleDirs) {
        const modulePath = path.join(modulesPath, moduleName);
        const moduleAnalysis = this.analyzeModule(modulePath, moduleName);
        modules[moduleName] = moduleAnalysis;
      }
    }

    return modules;
  }

  analyzeModule(modulePath, moduleName) {
    const analysis = {
      name: moduleName,
      fileCount: 0,
      totalSize: 0,
      complexity: 0,
      dependencies: [],
      issues: []
    };

    try {
      const files = this.getFilesRecursively(modulePath);
      analysis.fileCount = files.length;

      // Calculate total size
      analysis.totalSize = files.reduce((sum, file) => {
        return sum + fs.statSync(file).size;
      }, 0);

      // Analyze TypeScript/JavaScript files
      const tsFiles = files.filter(file => file.endsWith('.ts') || file.endsWith('.tsx'));
      analysis.complexity = this.calculateComplexity(tsFiles);

      // Check for common issues
      if (analysis.totalSize > this.thresholds.bundleSize) {
        analysis.issues.push('Module bundle size exceeds threshold');
      }

      if (analysis.complexity > 10) {
        analysis.issues.push('High cyclomatic complexity detected');
      }

      log.success(`${moduleName}: ${this.formatBytes(analysis.totalSize)} (${analysis.fileCount} files)`);

    } catch (error) {
      analysis.error = error.message;
      log.error(`Failed to analyze ${moduleName}: ${error.message}`);
    }

    return analysis;
  }

  calculateComplexity(files) {
    let complexity = 0;

    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        // Simple complexity calculation based on control flow statements
        const controlFlowPatterns = [
          /if\s*\(/g,
          /else\s*if\s*\(/g,
          /for\s*\(/g,
          /while\s*\(/g,
          /switch\s*\(/g,
          /case\s+/g,
          /catch\s*\(/g,
          /\?\s*\w+\s*:/g, // ternary operators
        ];

        controlFlowPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            complexity += matches.length;
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    });

    return complexity;
  }

  async analyzeMemoryUsage() {
    log.info('Analyzing memory usage patterns...');

    // This would typically involve runtime analysis
    // For now, we'll provide static analysis recommendations
    const analysis = {
      recommendations: [
        'Implement lazy loading for modules',
        'Use React.memo for expensive components',
        'Implement proper cleanup in useEffect hooks',
        'Monitor memory leaks in event listeners'
      ],
      patterns: [
        'Check for memory leaks in useEffect cleanup',
        'Verify proper disposal of subscriptions',
        'Monitor large object allocations'
      ]
    };

    log.success('Memory analysis complete');
    return analysis;
  }

  async analyzeApiPerformance() {
    log.info('Analyzing API performance patterns...');

    const apiPath = path.join(this.frontendPath, 'src/shared/services/api');
    const analysis = {
      endpoints: [],
      patterns: [],
      recommendations: []
    };

    if (fs.existsSync(apiPath)) {
      const apiFiles = this.getFilesRecursively(apiPath)
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

      apiFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // Look for API endpoint patterns
          const endpointMatches = content.match(/\/api\/[^\s'"]+/g);
          if (endpointMatches) {
            analysis.endpoints.push(...endpointMatches);
          }

          // Check for performance patterns
          if (content.includes('setTimeout') || content.includes('setInterval')) {
            analysis.patterns.push('Found timer usage - check for cleanup');
          }

          if (content.includes('fetch') && !content.includes('AbortController')) {
            analysis.patterns.push('Fetch requests without abort controller');
          }

        } catch (error) {
          // Skip files that can't be read
        }
      });
    }

    analysis.recommendations = [
      'Implement request caching',
      'Add request timeouts',
      'Use AbortController for cancellable requests',
      'Implement retry logic for failed requests'
    ];

    log.success(`Found ${analysis.endpoints.length} API endpoints`);
    return analysis;
  }

  generateSummary(report) {
    const summary = {
      overallScore: 0,
      totalIssues: 0,
      criticalIssues: 0,
      warnings: 0,
      recommendations: 0
    };

    // Calculate overall score
    let score = 100;

    // Deduct points for issues
    if (report.bundleAnalysis?.largeFiles?.length > 0) {
      score -= report.bundleAnalysis.largeFiles.length * 10;
    }

    if (report.bundleAnalysis?.totalSize > this.thresholds.bundleSize) {
      score -= 20;
    }

    // Count issues
    Object.values(report.modules).forEach(module => {
      if (module.issues) {
        summary.totalIssues += module.issues.length;
      }
    });

    summary.overallScore = Math.max(0, score);
    summary.recommendations = report.recommendations.length;

    return summary;
  }

  generateRecommendations(report) {
    const recommendations = [];

    // Bundle size recommendations
    if (report.bundleAnalysis?.totalSize > this.thresholds.bundleSize) {
      recommendations.push({
        category: 'Bundle Size',
        priority: 'high',
        message: 'Consider code splitting and lazy loading to reduce bundle size',
        action: 'Implement dynamic imports for large modules'
      });
    }

    // Module-specific recommendations
    Object.entries(report.modules).forEach(([moduleName, module]) => {
      if (module.issues?.length > 0) {
        recommendations.push({
          category: 'Module Performance',
          priority: 'medium',
          message: `Address ${module.issues.length} issues in ${moduleName} module`,
          action: 'Review and optimize module implementation'
        });
      }
    });

    // General recommendations
    recommendations.push(
      {
        category: 'Performance',
        priority: 'medium',
        message: 'Implement performance monitoring in production',
        action: 'Add real-time performance metrics collection'
      },
      {
        category: 'Caching',
        priority: 'low',
        message: 'Implement aggressive caching strategies',
        action: 'Add service worker and browser caching'
      }
    );

    return recommendations;
  }

  identifyIssues(report) {
    const issues = [];

    // Bundle issues
    if (report.bundleAnalysis?.largeFiles?.length > 0) {
      issues.push({
        type: 'bundle',
        severity: 'warning',
        message: `Large bundle files detected: ${report.bundleAnalysis.largeFiles.length} files exceed ${this.formatBytes(this.thresholds.bundleSize)}`
      });
    }

    // Module issues
    Object.entries(report.modules).forEach(([moduleName, module]) => {
      if (module.issues?.length > 0) {
        issues.push({
          type: 'module',
          severity: 'warning',
          message: `${moduleName}: ${module.issues.join(', ')}`
        });
      }
    });

    return issues;
  }

  saveReport(report) {
    try {
      fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
      log.success(`Performance report saved to: ${this.reportPath}`);
    } catch (error) {
      log.error(`Failed to save report: ${error.message}`);
    }
  }

  displayResults(report) {
    log.header('📊 Performance Audit Results');

    // Overall Score
    const score = report.summary.overallScore;
    const scoreColor = score >= 80 ? colors.green : score >= 60 ? colors.yellow : colors.red;
    console.log(`${scoreColor}Overall Score: ${score}/100${colors.reset}`);

    // Issues Summary
    if (report.summary.totalIssues > 0) {
      log.warn(`Total Issues: ${report.summary.totalIssues}`);
    }

    // Top Recommendations
    if (report.recommendations.length > 0) {
      log.section('🔧 Top Recommendations');
      report.recommendations
        .filter(rec => rec.priority === 'high')
        .slice(0, 3)
        .forEach(rec => {
          console.log(`${colors.yellow}• ${rec.message}${colors.reset}`);
        });
    }

    // Performance Summary
    if (report.bundleAnalysis?.totalSize) {
      log.section(' Bundle Summary');
      console.log(`Total Size: ${this.formatBytes(report.bundleAnalysis.totalSize)}`);
      console.log(`Files: ${report.bundleAnalysis.fileCount}`);
    }

    log.success('Performance audit completed successfully!');
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
  const auditor = new PerformanceAuditor();
  
  auditor.runAudit()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      log.error(`Audit failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = PerformanceAuditor;
