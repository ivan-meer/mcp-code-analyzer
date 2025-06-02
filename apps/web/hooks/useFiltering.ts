/**
 * Хук для управления фильтрацией и поиском данных анализа
 * 
 * Этот хук инкапсулирует всю логику фильтрации и поиска, делая ее
 * переиспользуемой между различными компонентами. Думайте о нем как
 * о "умном фильтре", который понимает структуру наших данных и может
 * эффективно искать и фильтровать их по различным критериям.
 * 
 * Принципы, реализованные в этом хуке:
 * 1. Мемоизация - дорогие вычисления выполняются только при изменении входных данных
 * 2. Debouncing - предотвращает слишком частые обновления при быстром вводе
 * 3. Композиция - сложные фильтры строятся из простых функций
 */

import { useState, useMemo, useCallback } from 'react';
import { ProjectFile } from '@/types/analysis.types';
import { ProjectTodo } from '@/types/todos.types';
import { FilterState, SearchState } from '@/types/analysis.types';

/**
 * Функция для "debouncing" - задержки выполнения функции
 * 
 * Представьте ситуацию: пользователь быстро печатает в поле поиска.
 * Без debouncing мы бы выполняли поиск на каждую букву, что неэффективно.
 * Debouncing ждет, пока пользователь не остановится на заданное время,
 * и только тогда выполняет поиск.
 * 
 * @param func - функция для выполнения
 * @param delay - задержка в миллисекундах
 * @returns "обернутая" функция с задержкой
 */
const useDebounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return useCallback((...args: Parameters<T>) => {
    // Отменяем предыдущий вызов, если он еще не выполнился
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Устанавливаем новый таймер
    const newTimeoutId = setTimeout(() => {
      func(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  }, [func, delay, timeoutId]) as T;
};

/**
 * Основной хук для фильтрации данных
 * 
 * Этот хук управляет всем состоянием фильтрации и предоставляет
 * функции для обновления фильтров и получения отфильтрованных данных.
 */
export const useFiltering = <T extends ProjectFile | ProjectTodo>(
  data: T[],
  initialFilters: Partial<FilterState> = {},
  initialSearch: Partial<SearchState> = {}
) => {
  // Состояние для фильтров
  const [filters, setFilters] = useState<FilterState>({
    fileTypes: [],
    sizeRange: [0, Number.MAX_SAFE_INTEGER],
    languageFilter: [],
    hasComments: false,
    todoTypes: [],
    ...initialFilters
  });

  // Состояние для поиска
  const [search, setSearch] = useState<SearchState>({
    query: '',
    searchFields: ['name', 'path'],
    caseSensitive: false,
    ...initialSearch
  });

  /**
   * Функция поиска с debouncing
   * 
   * Мы используем debouncing с задержкой 300ms - это оптимальное время,
   * которое не раздражает пользователя, но предотвращает избыточные вычисления.
   */
  const debouncedSetSearch = useDebounce((newSearch: Partial<SearchState>) => {
    setSearch(prev => ({ ...prev, ...newSearch }));
  }, 300);

  /**
   * Функция для проверки, соответствует ли элемент поисковому запросу
   * 
   * Эта функция реализует "умный поиск", который может искать по нескольким
   * полям и учитывать различные настройки поиска.
   */
  const matchesSearch = useCallback((item: T, searchState: SearchState): boolean => {
    // Если нет поискового запроса, считаем что элемент подходит
    if (!searchState.query.trim()) return true;

    const query = searchState.caseSensitive 
      ? searchState.query 
      : searchState.query.toLowerCase();

    // Проверяем каждое поле, указанное в searchFields
    return searchState.searchFields.some(field => {
      let fieldValue = '';
      
      // Безопасно получаем значение поля
      if (field in item && item[field as keyof T]) {
        fieldValue = String(item[field as keyof T]);
      }

      // Применяем настройки чувствительности к регистру
      const compareValue = searchState.caseSensitive 
        ? fieldValue 
        : fieldValue.toLowerCase();

      return compareValue.includes(query);
    });
  }, []);

  /**
   * Функция для проверки, соответствует ли файл фильтрам
   * 
   * Эта функция проверяет каждый активный фильтр и возвращает true
   * только если файл соответствует всем критериям.
   */
  const matchesFileFilters = useCallback((file: ProjectFile, filterState: FilterState): boolean => {
    // Фильтр по типам файлов
    if (filterState.fileTypes.length > 0 && !filterState.fileTypes.includes(file.type)) {
      return false;
    }

    // Фильтр по размеру файла
    if (file.size < filterState.sizeRange[0] || file.size > filterState.sizeRange[1]) {
      return false;
    }

    // Фильтр по наличию комментариев (примерная логика)
    if (filterState.hasComments) {
      // Предполагаем, что файлы с большим количеством строк относительно функций содержат комментарии
      const linesPerFunction = file.lines_of_code && file.functions.length > 0 
        ? file.lines_of_code / file.functions.length 
        : 0;
      if (linesPerFunction < 5) return false; // Эвристика для определения наличия комментариев
    }

    return true;
  }, []);

  /**
   * Функция для проверки, соответствует ли TODO фильтрам
   */
  const matchesTodoFilters = useCallback((todo: ProjectTodo, filterState: FilterState): boolean => {
    // Фильтр по типам TODO с учетом строгой типизации
    if (filterState.todoTypes.length > 0) {
      const todoType = todo.type as 'TODO' | 'FIXME' | 'HACK' | 'NOTE';
      if (!filterState.todoTypes.includes(todoType)) {
        return false;
      }
    }
    return true;
  }, []);

  /**
   * Мемоизированные отфильтрованные данные
   * 
   * Мы используем useMemo для того, чтобы пересчитывать фильтрованные
   * данные только когда изменяются исходные данные, фильтры или поиск.
   * Это критично для производительности при работе с большими наборами данных.
   */
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Сначала проверяем соответствие поисковому запросу
      if (!matchesSearch(item, search)) return false;

      // Затем применяем типоспецифичные фильтры
      if ('type' in item && 'size' in item) {
        // Это файл
        return matchesFileFilters(item as ProjectFile, filters);
      } else if ('line' in item && 'type' in item) {
        // Это TODO
        return matchesTodoFilters(item as ProjectTodo, filters);
      }

      return true;
    });
  }, [data, filters, search, matchesSearch, matchesFileFilters, matchesTodoFilters]);

  /**
   * Функция для обновления фильтров
   * 
   * Мы используем функциональное обновление состояния, чтобы гарантировать,
   * что мы работаем с актуальным состоянием, даже если компонент
   * вызывает эту функцию несколько раз подряд.
   */
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Функция для сброса всех фильтров к значениям по умолчанию
   */
  const resetFilters = useCallback(() => {
    setFilters({
      fileTypes: [],
      sizeRange: [0, Number.MAX_SAFE_INTEGER],
      languageFilter: [],
      hasComments: false,
      todoTypes: []
    });
    setSearch({
      query: '',
      searchFields: ['name', 'path'],
      caseSensitive: false
    });
  }, []);

  /**
   * Функция для быстрого поиска (с debouncing)
   */
  const quickSearch = useCallback((query: string) => {
    debouncedSetSearch({ query });
  }, [debouncedSetSearch]);

  /**
   * Получение уникальных значений для фильтров
   * 
   * Эти функции полезны для создания выпадающих списков в UI.
   * Например, мы можем показать пользователю только те типы файлов,
   * которые реально присутствуют в проекте.
   */
  const getAvailableFileTypes = useMemo(() => {
    const types = new Set<string>();
    data.forEach(item => {
      if ('type' in item) {
        types.add((item as ProjectFile).type);
      }
    });
    return Array.from(types).sort();
  }, [data]);

  const getAvailableTodoTypes = useMemo(() => {
    const types = new Set<string>();
    data.forEach(item => {
      if ('line' in item && 'type' in item) {
        types.add((item as ProjectTodo).type);
      }
    });
    return Array.from(types).sort();
  }, [data]);

  /**
   * Статистика фильтрации
   * 
   * Предоставляет информацию о том, сколько элементов показано
   * из общего количества. Полезно для отображения в UI.
   */
  const filterStats = useMemo(() => ({
    totalItems: data.length,
    filteredItems: filteredData.length,
    hiddenItems: data.length - filteredData.length,
    isFiltered: filteredData.length !== data.length
  }), [data.length, filteredData.length]);

  // Возвращаем все необходимые данные и функции
  return {
    // Данные
    filteredData,
    filters,
    search,
    
    // Функции обновления
    updateFilters,
    quickSearch,
    resetFilters,
    
    // Функция с полным контролем поиска (без debouncing)
    updateSearch: setSearch,
    
    // Вспомогательные данные
    availableFileTypes: getAvailableFileTypes,
    availableTodoTypes: getAvailableTodoTypes,
    stats: filterStats,
    
    // Функции проверки (могут быть полезны для внешнего использования)
    matchesSearch,
    matchesFileFilters,
    matchesTodoFilters
  };
};

/**
 * Специализированный хук для фильтрации файлов
 * 
 * Это "обертка" над основным хуком, которая предоставляет
 * дополнительные функции, специфичные для работы с файлами.
 */
export const useFileFiltering = (files: ProjectFile[]) => {
  const filtering = useFiltering(files, {
    fileTypes: [],
    sizeRange: [0, Number.MAX_SAFE_INTEGER],
    hasComments: false
  }, {
    searchFields: ['name', 'path']
  });

  /**
   * Функция для быстрой фильтрации по типу файла
   */
  const filterByType = useCallback((types: string[]) => {
    filtering.updateFilters({ fileTypes: types });
  }, [filtering]);

  /**
   * Функция для фильтрации по размеру файла
   */
  const filterBySize = useCallback((minSize: number, maxSize: number) => {
    filtering.updateFilters({ sizeRange: [minSize, maxSize] });
  }, [filtering]);

  return {
    ...filtering,
    filterByType,
    filterBySize,
    // Типизированные данные
    filteredFiles: filtering.filteredData as ProjectFile[]
  };
};

/**
 * Специализированный хук для фильтрации TODO комментариев
 */
export const useTodoFiltering = (todos: Array<ProjectTodo & { type: 'TODO' | 'FIXME' | 'HACK' | 'NOTE' }>) => {
  const filtering = useFiltering(todos, {
    todoTypes: []
  }, {
    searchFields: ['content', 'file_path']
  });

  /**
   * Функция для быстрой фильтрации по типу TODO
   */
  const filterByTodoType = useCallback((types: string[]) => {
    filtering.updateFilters({ todoTypes: types });
  }, [filtering]);

  return {
    ...filtering,
    filterByTodoType,
    // Типизированные данные
    filteredTodos: filtering.filteredData as ProjectTodo[]
  };
};
