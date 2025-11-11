import React, { useState } from 'react';

// Temporary inline helpers until the aiHelpers module is created
const getCommonPatterns = (): Record<string, string> => ({
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
});

const validateFilePath = (filePath: string): {
  valid: boolean;
  issues: string[];
  suggestions: string[];
} => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check if it's in the right directory
  if (filePath.includes('/modules/')) {
    const moduleMatch = filePath.match(/modules\/([^\/]+)/);
    if (!moduleMatch) {
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
};

const getModuleStructure = (moduleName: string): Record<string, string[]> => ({
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
});

interface AIUpdateGuideProps {
  moduleName?: string;
  onGenerateTemplate?: (template: any) => void;
}

const AIUpdateGuide: React.FC<AIUpdateGuideProps> = ({ 
  moduleName = 'NewModule',
  onGenerateTemplate 
}) => {
  const [selectedPattern, setSelectedPattern] = useState<string>('');
  const [filePath, setFilePath] = useState<string>('');
  const [validationResult, setValidationResult] = useState<any>(null);

  const commonPatterns = getCommonPatterns();
  const moduleStructure = getModuleStructure(moduleName);

  const handleValidatePath = () => {
    if (filePath) {
      const result = validateFilePath(filePath);
      setValidationResult(result);
    }
  };

  const generateComponentTemplate = () => {
    const template = {
      type: 'component',
      name: 'NewComponent',
      module: moduleName,
      pattern: selectedPattern,
      structure: moduleStructure
    };
    
    onGenerateTemplate?.(template);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🤖 AI Update Guide - PROPER 2.9
      </h2>

      {/* Architecture Overview */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          📋 Architecture Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-medium text-blue-900 mb-2">Module Structure</h4>
            <ul className="text-blue-800 space-y-1">
              <li>• Each module is self-contained</li>
              <li>• No cross-module imports allowed</li>
              <li>• Shared code in @shared/ directory</li>
              <li>• Consistent file naming conventions</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <h4 className="font-medium text-green-900 mb-2">Best Practices</h4>
            <ul className="text-green-800 space-y-1">
              <li>• Use absolute imports (@shared/, @modules/)</li>
              <li>• Follow naming conventions strictly</li>
              <li>• Include tests for all new code</li>
              <li>• Update module manifest when needed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Common Patterns */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          🎯 Common Patterns
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(commonPatterns).map(([key, pattern]) => (
            <div
              key={key}
              className={`p-3 rounded border cursor-pointer transition-colors ${
                selectedPattern === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPattern(key)}
            >
              <h4 className="font-medium text-gray-900 text-sm capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </h4>
              <p className="text-xs text-gray-600 mt-1">{pattern}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Module Structure */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          📁 Module Structure for {moduleName}
        </h3>
        <div className="bg-gray-50 p-4 rounded">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {Object.entries(moduleStructure).map(([category, files]) => (
              <div key={category}>
                <h4 className="font-medium text-gray-900 capitalize mb-2">
                  {category}
                </h4>
                <ul className="text-gray-600 space-y-1">
                  {files.map((file: string, index: number) => (
                    <li key={index} className="font-mono text-xs">
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* File Path Validation */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          ✅ File Path Validation
        </h3>
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="Enter file path (e.g., src/modules/AccessControl/components/MyComponent.tsx)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleValidatePath}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Validate
          </button>
        </div>
        
        {validationResult && (
          <div className={`p-4 rounded ${
            validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h4 className={`font-medium mb-2 ${
              validationResult.valid ? 'text-green-900' : 'text-red-900'
            }`}>
              {validationResult.valid ? '✅ Valid Path' : '❌ Issues Found'}
            </h4>
            
            {validationResult.issues.length > 0 && (
              <div className="mb-3">
                <h5 className="font-medium text-red-800 mb-1">Issues:</h5>
                <ul className="text-red-700 text-sm space-y-1">
                  {validationResult.issues.map((issue: string, index: number) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {validationResult.suggestions.length > 0 && (
              <div>
                <h5 className="font-medium text-blue-800 mb-1">Suggestions:</h5>
                <ul className="text-blue-700 text-sm space-y-1">
                  {validationResult.suggestions.map((suggestion: string, index: number) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Generation */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          🛠️ Template Generation
        </h3>
        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-sm text-yellow-800 mb-3">
            Select a pattern above and click generate to create a template for your new component.
          </p>
          <button
            onClick={generateComponentTemplate}
            disabled={!selectedPattern}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Template
          </button>
        </div>
      </div>

      {/* Quick Reference */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          📚 Quick Reference
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-purple-50 p-4 rounded">
            <h4 className="font-medium text-purple-900 mb-2">File Naming</h4>
            <ul className="text-purple-800 space-y-1">
              <li>• Components: PascalCase.tsx</li>
              <li>• Hooks: useXxx.ts</li>
              <li>• Services: xxxService.ts</li>
              <li>• Types: xxx.types.ts</li>
              <li>• Tests: xxx.test.tsx</li>
            </ul>
          </div>
          <div className="bg-indigo-50 p-4 rounded">
            <h4 className="font-medium text-indigo-900 mb-2">Import Rules</h4>
            <ul className="text-indigo-800 space-y-1">
              <li>• Shared code: @shared/</li>
              <li>• Module code: @modules/ModuleName</li>
              <li>• App config: @app/</li>
              <li>• No cross-module imports</li>
              <li>• Use absolute imports when possible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIUpdateGuide; 