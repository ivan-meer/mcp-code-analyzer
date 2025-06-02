/**
 * useAnalysisState - Централизованное управление состоянием анализа
 * 
 * Этот хук объединяет все состояние интерфейса анализа в одном месте,
 * обеспечивая консистентность и упрощая управление сложным UI.
 */

import { useState, useCallback, useReducer, useEffect } from 'react';
import { AnalysisTab } from '@/types/analysis.types';

// Типы для состояния
export interface AnalysisUIState {
  activeTab: AnalysisTab;
  sidebarCollapsed: boolean;
  insightsPanelVisible: boolean;
  searchVisible: boolean;
  exportDialogOpen: boolean;
  viewMode: 'grid' | 'list' | 'detail';
  filters: AnalysisFilters;
  searchQuery: string;
  selectedItems: string[];
  isLoading: boolean;
  errors: string[];
}

export interface AnalysisFilters {
  fileTypes: string[];
  languages: string[];
  sizeRange: [number, number];
  todoTypes: string[];
  priorityLevels: string[];
  dateRange: [Date | null, Date | null];
  hasDocumentation: boolean | null;
  hasTodos: boolean | null;
}

// Action types для reducer
type AnalysisAction =
  | { type: 'SET_ACTIVE_TAB'; payload: AnalysisTab }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_INSIGHTS_PANEL' }
  | { type: 'SET_SEARCH_VISIBLE'; payload: boolean }
  | { type: 'SET_EXPORT_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' | 'detail' }
  | { type: 'UPDATE_FILTERS'; payload: Partial<AnalysisFilters> }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_ITEMS'; payload: string[] }
  | { type: 'ADD_SELECTED_ITEM'; payload: string }
  | { type: 'REMOVE_SELECTED_ITEM'; payload: string }
  | { type: 'CLEAR_SELECTED_ITEMS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET_STATE' };

// Начальное состояние
const initialState: AnalysisUIState = {
  activeTab: AnalysisTab.VISUALIZATION,
  sidebarCollapsed: false,
  insightsPanelVisible: true,
  searchVisible: false,
  exportDialogOpen: false,
  viewMode: 'grid',
  filters: {
    fileTypes: [],
    languages: [],
    sizeRange: [0, Infinity],
    todoTypes: [],
    priorityLevels: [],
    dateRange: [null, null],
    hasDocumentation: null,
    hasTodos: null,
  },
  searchQuery: '',
  selectedItems: [],
  isLoading: false,
  errors: [],
};

// Reducer для управления состоянием
function analysisStateReducer(state: AnalysisUIState, action: AnalysisAction): AnalysisUIState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
        selectedItems: [],
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      };

    case 'TOGGLE_INSIGHTS_PANEL':
      return {
        ...state,
        insightsPanelVisible: !state.insightsPanelVisible,
      };

    case 'SET_SEARCH_VISIBLE':
      return {
        ...state,
        searchVisible: action.payload,
        searchQuery: action.payload ? state.searchQuery : '',
      };

    case 'SET_EXPORT_DIALOG_OPEN':
      return {
        ...state,
        exportDialogOpen: action.payload,
      };

    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload,
      };

    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };

    case 'SET_SELECTED_ITEMS':
      return {
        ...state,
        selectedItems: action.payload,
      };

    case 'ADD_SELECTED_ITEM':
      return {
        ...state,
        selectedItems: [...state.selectedItems, action.payload],
      };

    case 'REMOVE_SELECTED_ITEM':
      return {
        ...state,
        selectedItems: state.selectedItems.filter(item => item !== action.payload),
      };

    case 'CLEAR_SELECTED_ITEMS':
      return {
        ...state,
        selectedItems: [],
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload],
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Хук для управления состоянием анализа
export function useAnalysisState() {
  const [state, dispatch] = useReducer(analysisStateReducer, initialState);

  // Сохранение состояния в localStorage
  useEffect(() => {
    const stateToSave = {
      activeTab: state.activeTab,
      sidebarCollapsed: state.sidebarCollapsed,
      insightsPanelVisible: state.insightsPanelVisible,
      viewMode: state.viewMode,
      filters: state.filters,
    };
    
    try {
      localStorage.setItem('mcp-analysis-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save analysis state to localStorage:', error);
    }
  }, [state.activeTab, state.sidebarCollapsed, state.insightsPanelVisible, state.viewMode, state.filters]);

  // Восстановление состояния из localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('mcp-analysis-state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        
        // Восстанавливаем только безопасные части состояния
        if (parsed.activeTab) {
          dispatch({ type: 'SET_ACTIVE_TAB', payload: parsed.activeTab });
        }
        if (typeof parsed.sidebarCollapsed === 'boolean' && parsed.sidebarCollapsed !== state.sidebarCollapsed) {
          dispatch({ type: 'TOGGLE_SIDEBAR' });
        }
        if (typeof parsed.insightsPanelVisible === 'boolean' && parsed.insightsPanelVisible !== state.insightsPanelVisible) {
          dispatch({ type: 'TOGGLE_INSIGHTS_PANEL' });
        }
        if (parsed.viewMode) {
          dispatch({ type: 'SET_VIEW_MODE', payload: parsed.viewMode });
        }
        if (parsed.filters) {
          dispatch({ type: 'UPDATE_FILTERS', payload: parsed.filters });
        }
      }
    } catch (error) {
      console.warn('Failed to restore analysis state from localStorage:', error);
    }
  }, []);

  // Мемоизированные действия
  const setActiveTab = useCallback((tab: AnalysisTab) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    if (collapsed !== state.sidebarCollapsed) {
      dispatch({ type: 'TOGGLE_SIDEBAR' });
    }
  }, [state.sidebarCollapsed]);

  const setInsightsPanelVisible = useCallback((visible: boolean) => {
    if (visible !== state.insightsPanelVisible) {
      dispatch({ type: 'TOGGLE_INSIGHTS_PANEL' });
    }
  }, [state.insightsPanelVisible]);

  const setSearchVisible = useCallback((visible: boolean) => {
    dispatch({ type: 'SET_SEARCH_VISIBLE', payload: visible });
  }, []);

  const setExportDialogOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_EXPORT_DIALOG_OPEN', payload: open });
  }, []);

  const setViewMode = useCallback((mode: 'grid' | 'list' | 'detail') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  const updateFilters = useCallback((filters: Partial<AnalysisFilters>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const setSelectedItems = useCallback((items: string[]) => {
    dispatch({ type: 'SET_SELECTED_ITEMS', payload: items });
  }, []);

  const addSelectedItem = useCallback((item: string) => {
    dispatch({ type: 'ADD_SELECTED_ITEM', payload: item });
  }, []);

  const removeSelectedItem = useCallback((item: string) => {
    dispatch({ type: 'REMOVE_SELECTED_ITEM', payload: item });
  }, []);

  const clearSelectedItems = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTED_ITEMS' });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const addError = useCallback((error: string) => {
    dispatch({ type: 'ADD_ERROR', payload: error });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  return {
    // Состояние
    ...state,
    
    // Действия
    setActiveTab,
    setSidebarCollapsed,
    setInsightsPanelVisible,
    setSearchVisible,
    setExportDialogOpen,
    setViewMode,
    updateFilters,
    setSearchQuery,
    setSelectedItems,
    addSelectedItem,
    removeSelectedItem,
    clearSelectedItems,
    setLoading,
    addError,
    clearErrors,
    resetState,
    
    // Вычисляемые значения
    hasFilters: Object.values(state.filters).some(filter => 
      Array.isArray(filter) ? filter.length > 0 : 
      filter !== null && filter !== undefined && filter !== false
    ),
    hasSelectedItems: state.selectedItems.length > 0,
    hasErrors: state.errors.length > 0,
  };
}

export default useAnalysisState;
