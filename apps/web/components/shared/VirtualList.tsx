/**
 * Универсальный компонент виртуализированного списка
 * 
 * Этот компонент объединяет наш хук виртуализации с React компонентом,
 * предоставляя готовое решение для отображения больших списков данных
 * без потери производительности.
 * 
 * Компонент работает как "умное окно", которое показывает только ту часть
 * списка, которую пользователь может видеть, плюс небольшой запас для
 * плавной прокрутки.
 * 
 * Особенности:
 * 1. Автоматическая оптимизация производительности
 * 2. Поддержка элементов разной высоты
 * 3. Плавная прокрутка и навигация
 * 4. Встроенные индикаторы загрузки и состояний
 */

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, AlertCircle } from 'lucide-react';
import { useVirtualization, useResponsiveVirtualization } from '@/hooks/useVirtualization';

interface VirtualListProps<T> {
  // Основные данные
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  
  // Конфигурация виртуализации
  itemHeight?: number;
  getItemHeight?: (index: number) => number;
  overscan?: number;
  
  // Размеры
  height?: number;
  className?: string;
  
  // Состояния
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  
  // Обработчики событий
  onItemClick?: (item: T, index: number) => void;
  onScroll?: (scrollInfo: any) => void;
  
  // Настройки отображения
  showScrollIndicator?: boolean;
  animateItems?: boolean;
  enableKeyboardNavigation?: boolean;
  
  // Дополнительные элементы
  header?: React.ReactNode;
  footer?: React.ReactNode;
  
  // Доступность
  ariaLabel?: string;
  role?: string;
}

interface VirtualListRef {
  scrollToItem: (index: number, align?: 'start' | 'center' | 'end') => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  getScrollInfo: () => any;
}

/**
 * Компонент элемента списка с анимацией
 * 
 * Отдельный компонент для элемента упрощает анимации и обработку событий.
 */
const VirtualListItem: React.FC<{
  children: React.ReactNode;
  style: React.CSSProperties;
  index: number;
  animate: boolean;
  onClick?: () => void;
}> = ({ children, style, index, animate, onClick }) => {
  if (animate) {
    return (
      <motion.div
        style={style}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.2, 
          delay: Math.min(index * 0.05, 0.5) // Максимальная задержка 500ms
        }}
        onClick={onClick}
        className={onClick ? 'cursor-pointer' : undefined}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div 
      style={style} 
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : undefined}
    >
      {children}
    </div>
  );
};

/**
 * Компонент индикатора прокрутки
 * 
 * Показывает текущую позицию в списке и общий прогресс прокрутки.
 */
const ScrollIndicator: React.FC<{
  scrollInfo: any;
  totalItems: number;
}> = ({ scrollInfo, totalItems }) => {
  const { scrollPercentage, isScrolledToTop, isScrolledToBottom } = scrollInfo;

  return (
    <div className="absolute right-2 top-2 bg-slate-800/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
      <div className="flex items-center space-x-2">
        <div className="w-16 h-1 bg-slate-600 rounded">
          <div 
            className="h-full bg-blue-400 rounded transition-all duration-200"
            style={{ width: `${scrollPercentage}%` }}
          />
        </div>
        <span>{Math.round(scrollPercentage)}%</span>
      </div>
      <div className="text-center mt-1">
        {totalItems} элементов
      </div>
    </div>
  );
};

/**
 * Состояние пустого списка
 */
const EmptyState: React.FC<{
  message: string;
  icon?: React.ReactNode;
}> = ({ message, icon }) => (
  <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
    <div className="mb-4">
      {icon || <Search className="h-12 w-12" />}
    </div>
    <p className="text-sm text-center max-w-sm">{message}</p>
  </div>
);

/**
 * Состояние загрузки
 */
const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">Загрузка...</span>
    </div>
  </div>
);

/**
 * Состояние ошибки
 */
const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="flex flex-col items-center justify-center h-full text-red-500 dark:text-red-400">
    <AlertCircle className="h-12 w-12 mb-4" />
    <p className="text-sm text-center max-w-sm">{error}</p>
  </div>
);

/**
 * Основной компонент VirtualList
 */
export const VirtualList = forwardRef<VirtualListRef, VirtualListProps<any>>(
  <T extends any>({
    items,
    renderItem,
    itemHeight = 60,
    getItemHeight,
    overscan = 5,
    height = 400,
    className = '',
    loading = false,
    error = null,
    emptyMessage = 'Нет данных для отображения',
    emptyIcon,
    onItemClick,
    onScroll,
    showScrollIndicator = false,
    animateItems = false,
    enableKeyboardNavigation = false,
    header,
    footer,
    ariaLabel = 'Список элементов',
    role = 'list'
  }: VirtualListProps<T>, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);

    // Используем соответствующий хук виртуализации
    const virtualization = height > 0 
      ? useVirtualization(items, {
          itemHeight,
          containerHeight: height,
          overscan,
          getItemHeight
        })
      : useResponsiveVirtualization(items, itemHeight, overscan);

    // Предоставляем API для внешнего управления списком
    useImperativeHandle(ref, () => ({
      scrollToItem: (index: number, align?: 'start' | 'center' | 'end') => {
        virtualization.scrollToItem(index, align);
      },
      scrollToTop: () => {
        virtualization.scrollToItem(0);
      },
      scrollToBottom: () => {
        virtualization.scrollToItem(items.length - 1);
      },
      getScrollInfo: () => virtualization.scrollInfo
    }), [virtualization, items.length]);

    // Обрабатываем клавиатурную навигацию
    useEffect(() => {
      if (!enableKeyboardNavigation || !containerRef.current) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
            break;
          case 'ArrowUp':
            event.preventDefault();
            setFocusedIndex(prev => Math.max(prev - 1, 0));
            break;
          case 'Home':
            event.preventDefault();
            setFocusedIndex(0);
            virtualization.scrollToItem(0);
            break;
          case 'End':
            event.preventDefault();
            setFocusedIndex(items.length - 1);
            virtualization.scrollToItem(items.length - 1);
            break;
          case 'Enter':
          case ' ':
            if (focusedIndex >= 0 && onItemClick) {
              event.preventDefault();
              onItemClick(items[focusedIndex], focusedIndex);
            }
            break;
        }
      };

      const container = containerRef.current;
      container.addEventListener('keydown', handleKeyDown);
      container.setAttribute('tabindex', '0');

      return () => {
        container.removeEventListener('keydown', handleKeyDown);
      };
    }, [enableKeyboardNavigation, focusedIndex, items, onItemClick, virtualization]);

    // Автоматическая прокрутка к сфокусированному элементу
    useEffect(() => {
      if (enableKeyboardNavigation && focusedIndex >= 0) {
        virtualization.scrollToItem(focusedIndex, 'center');
      }
    }, [focusedIndex, enableKeyboardNavigation, virtualization]);

    // Уведомляем родительский компонент о прокрутке
    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
      virtualization.onScroll(event);
      onScroll?.(virtualization.scrollInfo);
    };

    // Классы для контейнера
    const containerClasses = [
      'virtual-list',
      'relative overflow-auto',
      'border border-slate-200 dark:border-slate-700',
      'bg-white dark:bg-slate-900',
      'rounded-lg',
      className
    ].filter(Boolean).join(' ');

    // Отображение состояний загрузки и ошибок
    if (loading) {
      return (
        <div className={containerClasses} style={{ height }}>
          <LoadingState />
        </div>
      );
    }

    if (error) {
      return (
        <div className={containerClasses} style={{ height }}>
          <ErrorState error={error} />
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className={containerClasses} style={{ height }}>
          <EmptyState message={emptyMessage} icon={emptyIcon} />
        </div>
      );
    }

    return (
      <div className="virtual-list-container">
        {/* Заголовок */}
        {header && (
          <div className="virtual-list-header mb-2">
            {header}
          </div>
        )}

        {/* Основной контейнер списка */}
        <div
          ref={containerRef}
          className={containerClasses}
          style={{ height }}
          onScroll={handleScroll}
          role={role}
          aria-label={ariaLabel}
          aria-rowcount={items.length}
        >
          {/* Индикатор прокрутки */}
          {showScrollIndicator && (
            <ScrollIndicator 
              scrollInfo={virtualization.scrollInfo} 
              totalItems={items.length}
            />
          )}

          {/* Виртуализированное содержимое */}
          <div 
            style={{ 
              height: virtualization.totalHeight,
              position: 'relative'
            }}
          >
            <AnimatePresence>
              {virtualization.visibleItems.map(({ index, item, style }) => (
                <VirtualListItem
                  key={`item-${index}`}
                  style={style}
                  index={index}
                  animate={animateItems}
                  onClick={() => onItemClick?.(item, index)}
                >
                  <div 
                    className={`virtual-list-item ${
                      enableKeyboardNavigation && focusedIndex === index 
                        ? 'ring-2 ring-blue-500 ring-opacity-50' 
                        : ''
                    }`}
                    role="listitem"
                    aria-rowindex={index + 1}
                  >
                    {renderItem(item, index)}
                  </div>
                </VirtualListItem>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Подвал */}
        {footer && (
          <div className="virtual-list-footer mt-2">
            {footer}
          </div>
        )}

        {/* Информация о производительности (только в dev режиме) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-slate-500 space-y-1">
            <div>
              Рендерится: {virtualization.performanceStats.renderedItems} из {virtualization.performanceStats.totalItems} элементов
            </div>
            <div>
              Экономия памяти: {Math.round(virtualization.performanceStats.memoryReduction)}%
            </div>
            <div>
              Позиция прокрутки: {Math.round(virtualization.scrollInfo.scrollTop)}px
            </div>
          </div>
        )}
      </div>
    );
  }
);

VirtualList.displayName = 'VirtualList';

/**
 * Специализированные варианты VirtualList для конкретных случаев использования
 */

// Простой список без виртуализации для небольших наборов данных
export const SimpleList = <T extends any>({
  items,
  renderItem,
  onItemClick,
  className = '',
  ...props
}: Omit<VirtualListProps<T>, 'height' | 'itemHeight'>) => {
  if (items.length <= 100) {
    // Для небольших списков не используем виртуализацию
    return (
      <div className={`simple-list space-y-2 ${className}`} {...props}>
        {items.map((item, index) => (
          <div 
            key={index}
            onClick={() => onItemClick?.(item, index)}
            className={onItemClick ? 'cursor-pointer' : undefined}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  // Для больших списков используем виртуализацию
  return <VirtualList items={items} renderItem={renderItem} onItemClick={onItemClick} className={className} {...props} />;
};

export default VirtualList;
