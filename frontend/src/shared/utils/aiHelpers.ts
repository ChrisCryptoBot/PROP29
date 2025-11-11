/**
 * AI Helper Utilities for PROPER 2.9
 * Functions to help AI understand and work with the modular architecture
 */

import { AI_CONSTANTS } from '@shared/types/ai.types';

/**
 * Get the module name from a file path
 */
export function getModuleFromPath(filePath: string): string | null {
  const modulesMatch = filePath.match(/modules\/([^\/]+)/);
  return modulesMatch ? modulesMatch[1] : null;
}

/**
 * Check if a file is in the shared directory
 */
export function isSharedFile(filePath: string): boolean {
  return filePath.includes('/shared/') || filePath.startsWith('@shared/');
}

/**
 * Check if a file is in a module directory
 */
export function isModuleFile(filePath: string): boolean {
  return filePath.includes('/modules/') || filePath.startsWith('@modules/');
}

/**
 * Get the appropriate import path for a file
 */
export function getImportPath(fromFile: string, toFile: string): string {
  const fromModule = getModuleFromPath(fromFile);
  const toModule = getModuleFromPath(toFile);
  
  // If both are in modules, use absolute import
  if (fromModule && toModule && fromModule !== toModule) {
    return `@modules/${toModule}`;
  }
  
  // If target is shared, use absolute import
  if (isSharedFile(toFile)) {
    return '@shared';
  }
  
  // Otherwise use relative import
  return './relative-path'; // This would need actual path calculation
}

/**
 * Validate that an import follows the architecture rules
 */
export function validateImport(fromFile: string, importPath: string): {
  valid: boolean;
  reason?: string;
  suggestion?: string;
} {
  const fromModule = getModuleFromPath(fromFile);
  
  // Check for cross-module imports
  if (fromModule && importPath.includes('/modules/')) {
    const targetModule = getModuleFromPath(importPath);
    if (targetModule && targetModule !== fromModule) {
      return {
        valid: false,
        reason: 'Cross-module imports are not allowed',
        suggestion: `Use @shared/ for shared code or move the code to the ${fromModule} module`
      };
    }
  }
  
  // Check for absolute imports when appropriate
  if (isSharedFile(importPath) && !importPath.startsWith('@shared/')) {
    return {
      valid: false,
      reason: 'Shared code should use absolute imports',
      suggestion: 'Use @shared/ instead of relative path'
    };
  }
  
  return { valid: true };
}

/**
 * Get the standard file structure for a module
 */
export function getModuleStructure(moduleName: string): Record<string, string[]> {
  return {
    components: [
      `${moduleName}.tsx`,
      'components/',
      'tabs/',
      'modals/'
    ],
    hooks: [
      'hooks/',
      'useModuleName.ts'
    ],
    services: [
      'services/',
      'api.ts'
    ],
    types: [
      'types/',
      'index.ts'
    ],
    utils: [
      'utils/',
      'constants.ts'
    ],
    tests: [
      '__tests__/',
      `${moduleName}.test.tsx`
    ],
    config: [
      'manifest.ts',
      'index.ts'
    ]
  };
}

/**
 * Suggest file locations based on content type
 */
export function suggestFileLocation(
  fileName: string, 
  contentType: 'component' | 'hook' | 'service' | 'type' | 'util' | 'test'
): string {
  const moduleName = fileName.replace(/\.(tsx?|jsx?)$/, '');
  
  switch (contentType) {
    case 'component':
      return `src/modules/${moduleName}/components/${fileName}`;
    case 'hook':
      return `src/modules/${moduleName}/hooks/${fileName}`;
    case 'service':
      return `src/modules/${moduleName}/services/${fileName}`;
    case 'type':
      return `src/modules/${moduleName}/types/${fileName}`;
    case 'util':
      return `src/modules/${moduleName}/utils/${fileName}`;
    case 'test':
      return `src/modules/${moduleName}/__tests__/${fileName}`;
    default:
      return `src/modules/${moduleName}/${fileName}`;
  }
}

/**
 * Check if a component should be shared or module-specific
 */
export function shouldBeShared(
  componentName: string,
  usage: string[],
  complexity: 'low' | 'medium' | 'high'
): boolean {
  // If used in multiple modules, it should be shared
  if (usage.length > 1) {
    return true;
  }
  
  // If it's a common UI pattern, it should be shared
  const commonPatterns = [
    'Button', 'Input', 'Modal', 'Table', 'Form', 'Card',
    'Loading', 'Error', 'Empty', 'Header', 'Footer'
  ];
  
  if (commonPatterns.some(pattern => componentName.includes(pattern))) {
    return true;
  }
  
  // If it's complex and could be reused, consider sharing
  if (complexity === 'high' && usage.length === 1) {
    return true;
  }
  
  return false;
}

/**
 * Generate a module manifest template
 */
export function generateModuleManifest(moduleName: string, options: {
  displayName: string;
  description: string;
  category: 'security' | 'operations' | 'admin' | 'guest';
  hasRouting?: boolean;
  hasModals?: boolean;
  hasRealtime?: boolean;
}): string {
  return `import type { ModuleManifest } from '@shared/registry';

export const ${moduleName.toLowerCase()}Manifest: ModuleManifest = {
  name: '${moduleName}',
  displayName: '${options.displayName}',
  version: '1.0.0',
  description: '${options.description}',
  dependencies: [],
  permissions: [
    '${options.category}.${moduleName.toLowerCase()}.read',
    '${options.category}.${moduleName.toLowerCase()}.write'
  ],
  routes: ${options.hasRouting ? `[
    {
      path: '/${moduleName.toLowerCase()}',
      children: [
        { path: '', component: 'OverviewTab' }
      ]
    }
  ]` : '[]'},
  lazy: () => import('./${moduleName}'),
  metadata: {
    category: '${options.category}',
    tags: ['${moduleName.toLowerCase()}'],
    author: 'PROPER 2.9 Team',
    bundle: {
      maxSize: '500KB',
      loadPriority: 'medium'
    }
  }
};

// Auto-register
import { ModuleRegistry } from '@shared/registry';
ModuleRegistry.register(${moduleName.toLowerCase()}Manifest);
`;
}

/**
 * Generate a component template
 */
export function generateComponentTemplate(
  componentName: string,
  moduleName: string,
  options: {
    type: 'page' | 'modal' | 'tab' | 'panel' | 'form' | 'list';
    hasProps?: boolean;
    hasState?: boolean;
    hasEvents?: boolean;
    styling?: 'css-modules' | 'tailwind';
  }
): string {
  const imports = [
    'import React',
    options.hasState ? 'useState' : '',
    options.hasEvents ? 'useCallback' : '',
    'from \'react\''
  ].filter(Boolean).join(', ');
  
  const propsInterface = options.hasProps ? `
interface ${componentName}Props {
  // Add props here
}` : '';
  
  const stateHooks = options.hasState ? `
  const [state, setState] = useState();` : '';
  
  const eventHandlers = options.hasEvents ? `
  const handleEvent = useCallback(() => {
    // Handle event
  }, []);` : '';
  
  const styling = options.styling === 'css-modules' 
    ? `import styles from './${componentName}.module.css';`
    : '';
  
  return `import React${options.hasState || options.hasEvents ? ', { useState, useCallback }' : ''} from 'react';
${styling}
${propsInterface}

const ${componentName}: React.FC${options.hasProps ? `<${componentName}Props>` : ''} = (${options.hasProps ? 'props' : ''}) => {${stateHooks}${eventHandlers}

  return (
    <div className="${options.styling === 'css-modules' ? `{styles.container}` : 'p-4'}">
      <h2>${componentName}</h2>
      <p>Component content goes here</p>
    </div>
  );
};

export default ${componentName};
`;
}

/**
 * Generate a hook template
 */
export function generateHookTemplate(
  hookName: string,
  moduleName: string,
  options: {
    hasParams?: boolean;
    hasReturn?: boolean;
    hasSideEffects?: boolean;
  }
): string {
  const imports = [
    'import {',
    options.hasSideEffects ? 'useEffect' : '',
    options.hasReturn ? 'useState' : '',
    '} from \'react\''
  ].filter(Boolean).join(' ');
  
  const params = options.hasParams ? '(params: any)' : '()';
  const returnType = options.hasReturn ? ': any' : '';
  
  return `import { ${options.hasSideEffects ? 'useEffect, ' : ''}${options.hasReturn ? 'useState' : ''} } from 'react';

export const ${hookName} = ${params}${returnType} => {
  ${options.hasReturn ? 'const [data, setData] = useState();' : ''}
  
  ${options.hasSideEffects ? `
  useEffect(() => {
    // Side effect logic
  }, []);` : ''}
  
  ${options.hasReturn ? 'return data;' : ''}
};
`;
}

/**
 * Generate a service template
 */
export function generateServiceTemplate(
  serviceName: string,
  moduleName: string,
  options: {
    hasApi?: boolean;
    hasEvents?: boolean;
  }
): string {
  const imports = [
    'import { ApiClient } from \'@shared/services/api\'',
    options.hasEvents ? 'import { useModuleEvents } from \'@shared/hooks\'' : ''
  ].filter(Boolean).join(';\n');
  
  return `${imports};

export class ${serviceName}Service {
  private static instance: ${serviceName}Service;
  private api = ApiClient.getInstance().createModuleApi('${moduleName.toLowerCase()}');
  
  static getInstance(): ${serviceName}Service {
    if (!${serviceName}Service.instance) {
      ${serviceName}Service.instance = new ${serviceName}Service();
    }
    return ${serviceName}Service.instance;
  }
  
  ${options.hasApi ? `
  async getData() {
    return this.api.get('/data');
  }
  
  async createData(data: any) {
    return this.api.post('/data', data);
  }` : ''}
  
  ${options.hasEvents ? `
  emitEvent(type: string, data: any) {
    // Event emission logic
  }` : ''}
}
`;
}

/**
 * Validate a file path follows the architecture
 */
export function validateFilePath(filePath: string): {
  valid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check if it's in the right directory
  if (filePath.includes('/modules/')) {
    const moduleName = getModuleFromPath(filePath);
    if (!moduleName) {
      issues.push('Invalid module path');
    }
  }
  
  // Check file naming
  const fileName = filePath.split('/').pop() || '';
  if (fileName.includes('.tsx') && !fileName.match(/^[A-Z][a-zA-Z]*\.tsx$/)) {
    issues.push('Component files should be PascalCase');
    suggestions.push('Rename to PascalCase (e.g., MyComponent.tsx)');
  }
  
  if (fileName.includes('use') && !fileName.match(/^use[A-Z][a-zA-Z]*\.ts$/)) {
    issues.push('Hook files should follow useXxx pattern');
    suggestions.push('Rename to useXxx.ts (e.g., useMyHook.ts)');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    suggestions
  };
}

/**
 * Get common patterns for the codebase
 */
export function getCommonPatterns(): Record<string, string> {
  return {
    errorHandling: 'ErrorBoundary with module-specific fallback',
    loadingStates: 'Suspense with LoadingSpinner component',
    formValidation: 'react-hook-form with custom validation',
    dataFetching: 'React Query with module-specific API client',
    stateUpdates: 'Optimistic updates with rollback on error',
    styling: 'Tailwind CSS with CSS modules for complex components',
    testing: 'Jest + React Testing Library with module isolation',
    routing: 'React Router with module-specific routes',
    modals: 'Portal-based modals with proper cleanup',
    events: 'Module event bus for cross-component communication'
  };
} 