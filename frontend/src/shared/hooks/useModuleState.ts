import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../app/store/store';
import { ModuleEventBus } from '../services/events';

interface ModuleState {
  [key: string]: any;
}

interface ModuleStateHook<T = ModuleState> {
  state: T;
  setState: (updates: Partial<T>) => void;
  resetState: () => void;
  clearState: () => void;
}

export const useModuleState = <T extends Record<string, any>>(
  moduleName: string,
  initialState?: T
): ModuleStateHook<T> => {
  const dispatch = useDispatch();
  const moduleState = useSelector((state: RootState) => 
    state.modules?.[moduleName] as T || ({} as T)
  );

  // Initialize state if not exists and initial state provided
  useEffect(() => {
    const hasState = moduleState && typeof moduleState === 'object' && Object.keys(moduleState as object).length > 0;
    
    if (initialState && !hasState) {
      dispatch({
        type: 'modules/setState',
        payload: { moduleName, state: initialState }
      });
    }
  }, [moduleName, initialState, dispatch, moduleState]);

  const setState = useCallback((updates: Partial<T>) => {
    const newState = { ...moduleState, ...updates };
    
    dispatch({
      type: 'modules/setState',
      payload: { moduleName, state: newState }
    });

    // Emit state change event
    ModuleEventBus.getInstance().emit('module.state.changed', {
      moduleName,
      updates,
      newState
    }, moduleName);
  }, [dispatch, moduleName, moduleState]);

  const resetState = useCallback(() => {
    if (initialState) {
      dispatch({
        type: 'modules/setState',
        payload: { moduleName, state: initialState }
      });
      
      ModuleEventBus.getInstance().emit('module.state.reset', {
        moduleName,
        state: initialState
      }, moduleName);
    }
  }, [dispatch, moduleName, initialState]);

  const clearState = useCallback(() => {
    dispatch({
      type: 'modules/clearState',
      payload: { moduleName }
    });
    
    ModuleEventBus.getInstance().emit('module.state.cleared', {
      moduleName
    }, moduleName);
  }, [dispatch, moduleName]);

  return {
    state: moduleState,
    setState,
    resetState,
    clearState
  };
}; 