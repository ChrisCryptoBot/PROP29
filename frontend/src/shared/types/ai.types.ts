/**
 * AI-Optimized Type Definitions for PROPER 2.9
 * These types help AI understand the codebase structure and make informed updates
 */

// Module System Types
export interface ModuleContext {
  name: string;
  displayName: string;
  category: 'security' | 'operations' | 'admin' | 'guest';
  dependencies: string[];
  permissions: string[];
  hasRouting: boolean;
  hasModals: boolean;
  hasRealtime: boolean;
  uiTheme: 'standard' | 'dark' | 'branded';
}

// Update Context Types
export interface UpdateContext {
  moduleName: string;
  changeType: 'feature' | 'bugfix' | 'refactor' | 'performance' | 'ui';
  affectedFiles: string[];
  dependencies: string[];
  breakingChanges: boolean;
  requiresMigration: boolean;
}

// Code Generation Templates
export interface ComponentTemplate {
  name: string;
  type: 'page' | 'modal' | 'tab' | 'panel' | 'form' | 'list';
  props: Record<string, any>;
  state: Record<string, any>;
  events: string[];
  styling: 'css-modules' | 'tailwind' | 'styled-components';
}

// AI Assistant Configuration
export interface AIAssistantConfig {
  codebaseContext: {
    architecture: 'modular';
    framework: 'react-typescript';
    styling: 'tailwind-css-modules';
    stateManagement: 'redux-toolkit';
    apiClient: 'axios-react-query';
  };
  updateGuidelines: {
    preserveModuleIsolation: boolean;
    useAbsoluteImports: boolean;
    followNamingConventions: boolean;
    maintainTypeSafety: boolean;
    updateTests: boolean;
  };
  commonPatterns: {
    errorHandling: 'error-boundary';
    loadingStates: 'suspense-spinner';
    formValidation: 'react-hook-form';
    dataFetching: 'react-query';
    stateUpdates: 'optimistic-updates';
  };
}

// File Structure Metadata
export interface FileMetadata {
  purpose: 'component' | 'hook' | 'service' | 'type' | 'util' | 'test' | 'config';
  module: string;
  dependencies: string[];
  exports: string[];
  imports: string[];
  lastModified: string;
  complexity: 'low' | 'medium' | 'high';
}

// Update Impact Analysis
export interface UpdateImpact {
  directChanges: string[];
  indirectChanges: string[];
  testsToUpdate: string[];
  documentationToUpdate: string[];
  migrationSteps: string[];
  rollbackPlan: string[];
}

// AI-Friendly Constants
export const AI_CONSTANTS = {
  // File naming patterns
  PATTERNS: {
    COMPONENT: /^[A-Z][a-zA-Z]*\.tsx$/,
    HOOK: /^use[A-Z][a-zA-Z]*\.ts$/,
    SERVICE: /^[a-z][a-zA-Z]*Service\.ts$/,
    TYPE: /^[a-z][a-zA-Z]*\.types\.ts$/,
    TEST: /^.*\.test\.(ts|tsx)$/,
  },
  
  // Directory structure
  DIRECTORIES: {
    MODULES: 'src/modules',
    SHARED: 'src/shared',
    APP: 'src/app',
    ASSETS: 'src/assets',
    CONFIG: 'src/config',
  },
  
  // Import patterns
  IMPORTS: {
    ABSOLUTE: /^@(app|shared|modules|config)\//,
    RELATIVE: /^\.\.?\//,
    EXTERNAL: /^[a-zA-Z]/,
  },
  
  // Common file extensions
  EXTENSIONS: {
    COMPONENT: '.tsx',
    HOOK: '.ts',
    SERVICE: '.ts',
    TYPE: '.types.ts',
    STYLE: '.module.css',
    TEST: '.test.tsx',
  },
} as const;

// AI Update Instructions
export interface AIUpdateInstructions {
  context: string;
  requirements: string[];
  constraints: string[];
  examples: string[];
  expectedOutput: string;
  validationRules: string[];
}

// Module Update Templates
export interface ModuleUpdateTemplate {
  moduleName: string;
  updateType: 'add-feature' | 'modify-feature' | 'fix-bug' | 'optimize' | 'refactor';
  filesToModify: {
    [filePath: string]: {
      changes: string[];
      newCode?: string;
      imports?: string[];
    };
  };
  newFiles?: {
    [filePath: string]: string;
  };
  testsToUpdate: string[];
  documentationUpdates: string[];
} 