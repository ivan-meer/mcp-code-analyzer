/**
 * Универсальный компонент для поиска и фильтрации данных
 * 
 * Этот компонент предоставляет единообразный интерфейс для поиска и фильтрации
 * в различных секциях приложения. Он работает как "швейцарский армейский нож"
 * для всех операций поиска и фильтрации.
 * 
 * Принципы дизайна:
 * 1. Переиспользуемость - один компонент для разных типов данных
 * 2. Гибкость - настраиваемые фильтры и поиск
 * 3. Доступность - полная поддержка клавиатурной навигации
 * 4. Производительность - debouncing и мемоизация
 */

import React, { useState, useCallback } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FilterState, SearchState } from '@/types/analysis.types';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
  category?: string;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiSelect?: boolean;
  type?: 'checkbox' | 'radio' | 'range' | 'toggle';
}

interface SearchFilterProps {
  // Поисковые настройки
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (query: string) => void;
  
  // Настройки фильтрации
  filterGroups?: FilterGroup[];
  activeFilters?: { [groupId: string]: string[] };
  onFilterChange?: (groupId: string, values: string[]) => void;
  
  // Статистика
  totalItems?: number;
  filteredItems?: number;
  
  // Состояние компонента
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  
  // Дополнительные настройки
  showClearAll?: boolean;
  onClearAll?: () => void;
  
  // Кастомизация внешнего вида
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

/**
 * Компонент одной группы фильтров
 * 
 * Отдельный компонент для группы фильтров упрощает логику и делает
 * код более читаемым. Каждая группа может иметь свой тип отображения.
 */
const FilterGroupComponent: React.FC<{
  group: FilterGroup;
  activeValues: string[];
  onChange: (values: string[]) => void;
  variant: 'default' | 'compact' | 'minimal';
}> = ({ group, activeValues, onChange, variant }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleOptionToggle = useCallback((optionId: string) => {
    if (group.multiSelect !== false) {
      // Множественный выбор (по умолчанию)
      const newValues = activeValues.includes(optionId)
        ? activeValues.filter(id => id !== optionId)
        : [...activeValues, optionId];
      onChange(newValues);
    } else {
      // Одиночный выбор
      onChange(activeValues.includes(optionId) ? [] : [optionId]);
    }
  }, [group.multiSelect, activeValues, onChange]);

  if (variant === 'minimal') {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {group.label}
        </label>
        <div className="flex flex-wrap gap-1">
          {group.options.map(option => (
            <Badge
              key={option.id}
              variant={activeValues.includes(option.id) ? 'default' : 'outline'}
              className="cursor-pointer text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
              onClick={() => handleOptionToggle(option.id)}
            >
              {option.label}
              {option.count && ` (${option.count})`}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
        aria-expanded={isExpanded}
        aria-controls={`filter-group-${group.id}`}
      >
        <span>{group.label}</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div id={`filter-group-${group.id}`} className="space-y-1 pl-2">
          {group.options.map(option => (
            <label
              key={option.id}
              className="flex items-center space-x-2 cursor-pointer group"
            >
              <input
                type={group.multiSelect !== false ? 'checkbox' : 'radio'}
                name={group.multiSelect === false ? group.id : undefined}
                checked={activeValues.includes(option.id)}
                onChange={() => handleOptionToggle(option.id)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">
                {option.label}
                {option.count !== undefined && (
                  <span className="ml-1 text-xs text-slate-500">({option.count})</span>
                )}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Основной компонент SearchFilter
 */
export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchPlaceholder = 'Поиск...',
  searchValue = '',
  onSearchChange,
  filterGroups = [],
  activeFilters = {},
  onFilterChange,
  totalItems = 0,
  filteredItems = 0,
  isCollapsible = true,
  defaultExpanded = true,
  showClearAll = true,
  onClearAll,
  variant = 'default',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [searchFocused, setSearchFocused] = useState(false);

  // Подсчитываем количество активных фильтров
  const activeFilterCount = Object.values(activeFilters).reduce(
    (count, values) => count + values.length,
    0
  );

  // Определяем, есть ли активные фильтры или поиск
  const hasActiveFilters = activeFilterCount > 0 || searchValue.length > 0;

  const handleClearAll = useCallback(() => {
    onClearAll?.();
  }, [onClearAll]);

  const containerClasses = [
    'search-filter',
    variant === 'compact' && 'compact-mode',
    variant === 'minimal' && 'minimal-mode',
    className
  ].filter(Boolean).join(' ');

  if (variant === 'minimal') {
    return (
      <div className={containerClasses}>
        <div className="flex items-center space-x-4 mb-4">
          {/* Компактный поиск */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 h-8"
            />
          </div>

          {/* Статистика */}
          {totalItems > 0 && (
            <div className="text-xs text-slate-500 whitespace-nowrap">
              {filteredItems} из {totalItems}
            </div>
          )}

          {/* Очистка */}
          {hasActiveFilters && showClearAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-8 px-2 text-xs"
            >
              Очистить
            </Button>
          )}
        </div>

        {/* Компактные фильтры */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filterGroups.map(group => (
            <FilterGroupComponent
              key={group.id}
              group={group}
              activeValues={activeFilters[group.id] || []}
              onChange={(values) => onFilterChange?.(group.id, values)}
              variant={variant}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className={containerClasses}>
      <CardContent className="p-4">
        {/* Заголовок с возможностью сворачивания */}
        {isCollapsible && (
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
              aria-expanded={isExpanded}
              aria-controls="search-filter-content"
            >
              <Filter className="h-4 w-4" />
              <span>Поиск и фильтры</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount}
                </Badge>
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {/* Статистика в заголовке */}
            {totalItems > 0 && (
              <div className="text-sm text-slate-500">
                Показано: <span className="font-medium">{filteredItems}</span> из{' '}
                <span className="font-medium">{totalItems}</span>
              </div>
            )}
          </div>
        )}

        {/* Основное содержимое */}
        {(!isCollapsible || isExpanded) && (
          <div id="search-filter-content" className="space-y-4">
            {/* Поле поиска */}
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${
                  searchFocused
                    ? 'text-blue-500'
                    : 'text-slate-400'
                }`}
              />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="pl-10"
                aria-label="Поиск по содержимому"
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Очистить поиск"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Активные фильтры */}
            {hasActiveFilters && (
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Активные фильтры:
                </span>
                {Object.entries(activeFilters).map(([groupId, values]) =>
                  values.map(value => {
                    const group = filterGroups.find(g => g.id === groupId);
                    const option = group?.options.find(o => o.id === value);
                    if (!option) return null;

                    return (
                      <Badge
                        key={`${groupId}-${value}`}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                        onClick={() => {
                          const newValues = activeFilters[groupId]?.filter(v => v !== value) || [];
                          onFilterChange?.(groupId, newValues);
                        }}
                      >
                        {option.label}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    );
                  })
                )}
                {showClearAll && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-xs h-6 px-2"
                  >
                    Очистить все
                  </Button>
                )}
              </div>
            )}

            {/* Группы фильтров */}
            {filterGroups.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                {filterGroups.map(group => (
                  <FilterGroupComponent
                    key={group.id}
                    group={group}
                    activeValues={activeFilters[group.id] || []}
                    onChange={(values) => onFilterChange?.(group.id, values)}
                    variant={variant}
                  />
                ))}
              </div>
            )}

            {/* Статистика результатов (только в полном режиме) */}
            {!isCollapsible && totalItems > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {filteredItems === totalItems ? (
                    `Показаны все ${totalItems} элементов`
                  ) : (
                    <>
                      Показано <span className="font-medium text-slate-800 dark:text-slate-200">{filteredItems}</span> из{' '}
                      <span className="font-medium text-slate-800 dark:text-slate-200">{totalItems}</span> элементов
                      {activeFilterCount > 0 && (
                        <span className="ml-2 text-xs">
                          (скрыто: {totalItems - filteredItems})
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchFilter;
