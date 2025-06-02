/**
 * useKeyboardShortcuts - Продвинутые клавиатурные сочетания
 * 
 * Обеспечивает быструю навигацию и управление интерфейсом через клавиатуру.
 * Поддерживает контекстные сочетания в зависимости от активной вкладки.
 */

import { useEffect, useCallback, useRef } from 'react';
import { AnalysisTab } from '@/types/analysis.types';

interface KeyboardShortcutsConfig {
  onTabSwitch: (tab: AnalysisTab) => void;
  onSearch: () => void;
  onExport: () => void;
  onBack: () => void;
  tabs: Record<string, { shortcut: string; id: AnalysisTab }>;
}

export function useKeyboardShortcuts({
  onTabSwitch,
  onSearch,
  onExport,
  onBack,
  tabs
}: KeyboardShortcutsConfig) {
  const isInputFocused = useRef(false);

  // Отслеживание фокуса на input элементах
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      isInputFocused.current = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
                               target.contentEditable === 'true';
    };

    const handleFocusOut = () => {
      isInputFocused.current = false;
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Игнорируем сочетания клавиш когда фокус на input элементах
    if (isInputFocused.current) return;

    const { key, ctrlKey, metaKey, altKey, shiftKey } = event;
    const isModifierPressed = ctrlKey || metaKey;

    // Глобальные сочетания
    if (isModifierPressed && !altKey && !shiftKey) {
      switch (key.toLowerCase()) {
        case 'k':
          event.preventDefault();
          onSearch();
          break;
        case 'e':
          event.preventDefault();
          onExport();
          break;
        case 'backspace':
          event.preventDefault();
          onBack();
          break;
      }
    }

    // Сочетания с Alt для переключения вкладок
    if (altKey && !ctrlKey && !metaKey && !shiftKey) {
      const tabEntry = Object.values(tabs).find(tab => 
        tab.shortcut.toLowerCase() === key.toLowerCase()
      );
      
      if (tabEntry) {
        event.preventDefault();
        onTabSwitch(tabEntry.id);
      }
    }

    // Escape для выхода из модальных окон
    if (key === 'Escape') {
      // Это будет обрабатываться на уровне модальных компонентов
      return;
    }

    // Числовые клавиши для быстрого переключения вкладок
    if (!isModifierPressed && !altKey && /^[1-6]$/.test(key)) {
      const tabOrder = [
        AnalysisTab.VISUALIZATION,
        AnalysisTab.FILES,
        AnalysisTab.DEPENDENCIES,
        AnalysisTab.TODOS,
        AnalysisTab.DOCUMENTATION,
        AnalysisTab.DUPLICATES
      ];
      
      const tabIndex = parseInt(key) - 1;
      if (tabIndex >= 0 && tabIndex < tabOrder.length) {
        event.preventDefault();
        onTabSwitch(tabOrder[tabIndex]);
      }
    }

  }, [onTabSwitch, onSearch, onExport, onBack, tabs]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Показ подсказок по горячим клавишам
  const showShortcutsHelp = useCallback(() => {
    const shortcuts = [
      { key: 'Ctrl/Cmd + K', description: 'Открыть поиск' },
      { key: 'Ctrl/Cmd + E', description: 'Экспорт данных' },
      { key: 'Ctrl/Cmd + Backspace', description: 'Вернуться назад' },
      { key: '1-6', description: 'Переключение вкладок' },
      { key: 'Alt + V', description: 'Визуализация' },
      { key: 'Alt + F', description: 'Файлы' },
      { key: 'Alt + D', description: 'Зависимости' },
      { key: 'Alt + T', description: 'Задачи' },
      { key: 'Alt + O', description: 'Документация' },
      { key: 'Alt + U', description: 'Дубликаты' },
      { key: 'Escape', description: 'Закрыть модальные окна' },
    ];

    return shortcuts;
  }, []);

  return {
    showShortcutsHelp
  };
}

export default useKeyboardShortcuts;
