/**
 * Хук для виртуализации больших списков данных
 * 
 * Виртуализация - это техника оптимизации, которая рендерит только видимые
 * элементы списка, даже если сам список содержит тысячи элементов.
 * 
 * Представьте ситуацию: у вас есть список из 10,000 файлов проекта.
 * Без виртуализации браузер попытается создать 10,000 DOM элементов одновременно,
 * что приведет к замедлению и даже зависанию страницы.
 * 
 * С виртуализацией мы создаем только те элементы, которые пользователь
 * может видеть на экране (обычно 10-20 штук), плюс несколько "запасных"
 * для плавной прокрутки.
 * 
 * Этот подход используют такие популярные приложения как:
 * - Instagram (лента фотографий)
 * - Facebook (список постов)
 * - VS Code (список файлов в больших проектах)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

interface VirtualItem {
  index: number;          // Индекс элемента в исходном массиве
  start: number;          // Позиция начала элемента в пикселях
  end: number;            // Позиция конца элемента в пикселях
  height: number;         // Высота элемента в пикселях
}

interface VirtualizationConfig {
  itemHeight: number;     // Высота одного элемента (если все элементы одинаковой высоты)
  containerHeight: number; // Высота видимого контейнера
  overscan: number;       // Количество дополнительных элементов для рендеринга
  getItemHeight?: (index: number) => number; // Функция для определения высоты элемента (для динамических высот)
}

/**
 * Основной хук для виртуализации списков
 * 
 * @param items - массив элементов для отображения
 * @param config - конфигурация виртуализации
 * @returns объект с данными для рендеринга виртуализированного списка
 */
export const useVirtualization = <T>(items: T[], config: VirtualizationConfig) => {
  // Состояние для отслеживания позиции прокрутки
  const [scrollTop, setScrollTop] = useState(0);
  
  // Состояние для отслеживания размеров контейнера
  const [containerHeight, setContainerHeight] = useState(config.containerHeight);

  /**
   * Мемоизированный расчет позиций элементов
   * 
   * Этот расчет может быть дорогим для больших списков, поэтому мы
   * мемоизируем его и пересчитываем только при изменении данных или конфигурации.
   */
  const itemPositions = useMemo(() => {
    const positions: VirtualItem[] = [];
    let currentPosition = 0;

    // Рассчитываем позицию каждого элемента
    for (let i = 0; i < items.length; i++) {
      // Определяем высоту элемента
      const height = config.getItemHeight ? config.getItemHeight(i) : config.itemHeight;
      
      positions.push({
        index: i,
        start: currentPosition,
        end: currentPosition + height,
        height: height
      });

      currentPosition += height;
    }

    return positions;
  }, [items.length, config.itemHeight, config.getItemHeight]);

  /**
   * Общая высота всего списка
   * 
   * Это нужно для правильного отображения полосы прокрутки.
   * Браузер должен знать, насколько большой на самом деле наш список.
   */
  const totalHeight = useMemo(() => {
    if (itemPositions.length === 0) return 0;
    const lastItem = itemPositions[itemPositions.length - 1];
    return lastItem.end;
  }, [itemPositions]);

  /**
   * Определение видимого диапазона элементов
   * 
   * Эта функция определяет, какие элементы должны быть отрендерены
   * на основе текущей позиции прокрутки.
   */
  const visibleRange = useMemo(() => {
    if (itemPositions.length === 0) {
      return { startIndex: 0, endIndex: 0, visibleItems: [] };
    }

    // Находим первый видимый элемент
    // Используем бинарный поиск для эффективности
    let startIndex = 0;
    let endIndex = itemPositions.length - 1;

    while (startIndex <= endIndex) {
      const middleIndex = Math.floor((startIndex + endIndex) / 2);
      const item = itemPositions[middleIndex];

      if (item.end <= scrollTop) {
        startIndex = middleIndex + 1;
      } else if (item.start > scrollTop) {
        endIndex = middleIndex - 1;
      } else {
        startIndex = middleIndex;
        break;
      }
    }

    // Находим последний видимый элемент
    const viewportBottom = scrollTop + containerHeight;
    let visibleEndIndex = startIndex;

    while (
      visibleEndIndex < itemPositions.length &&
      itemPositions[visibleEndIndex].start < viewportBottom
    ) {
      visibleEndIndex++;
    }

    // Добавляем "overscan" - дополнительные элементы для плавности прокрутки
    const overscanStart = Math.max(0, startIndex - config.overscan);
    const overscanEnd = Math.min(itemPositions.length - 1, visibleEndIndex + config.overscan);

    // Создаем массив видимых элементов с их данными
    const visibleItems = [];
    for (let i = overscanStart; i <= overscanEnd; i++) {
      const position = itemPositions[i];
      visibleItems.push({
        index: i,
        item: items[i],
        style: {
          position: 'absolute' as const,
          top: position.start,
          height: position.height,
          width: '100%'
        }
      });
    }

    return {
      startIndex: overscanStart,
      endIndex: overscanEnd,
      visibleItems
    };
  }, [itemPositions, scrollTop, containerHeight, config.overscan, items]);

  /**
   * Обработчик события прокрутки
   * 
   * Эта функция вызывается каждый раз, когда пользователь прокручивает список.
   * Мы обновляем состояние scrollTop, что приводит к пересчету видимых элементов.
   */
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
  }, []);

  /**
   * Функция для программной прокрутки к определенному элементу
   * 
   * Полезно для реализации функций типа "перейти к элементу".
   */
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (index < 0 || index >= itemPositions.length) return;

    const item = itemPositions[index];
    let targetScrollTop = item.start;

    // Выравнивание элемента в видимой области
    switch (align) {
      case 'center':
        targetScrollTop = item.start - containerHeight / 2 + item.height / 2;
        break;
      case 'end':
        targetScrollTop = item.end - containerHeight;
        break;
      default: // 'start'
        targetScrollTop = item.start;
    }

    // Ограничиваем прокрутку допустимыми значениями
    targetScrollTop = Math.max(0, Math.min(targetScrollTop, totalHeight - containerHeight));
    
    setScrollTop(targetScrollTop);
  }, [itemPositions, containerHeight, totalHeight]);

  /**
   * Функция для обновления высоты контейнера
   * 
   * Полезно при изменении размеров окна или при адаптивном дизайне.
   */
  const updateContainerHeight = useCallback((newHeight: number) => {
    setContainerHeight(newHeight);
  }, []);

  /**
   * Информация о текущем состоянии прокрутки
   * 
   * Полезно для отображения индикаторов прокрутки или позиции в списке.
   */
  const scrollInfo = useMemo(() => {
    const scrollPercentage = totalHeight > 0 ? (scrollTop / (totalHeight - containerHeight)) * 100 : 0;
    const isScrolledToTop = scrollTop === 0;
    const isScrolledToBottom = scrollTop >= totalHeight - containerHeight;

    return {
      scrollTop,
      scrollPercentage: Math.max(0, Math.min(100, scrollPercentage)),
      isScrolledToTop,
      isScrolledToBottom,
      totalHeight,
      containerHeight
    };
  }, [scrollTop, totalHeight, containerHeight]);

  /**
   * Статистика производительности
   * 
   * Показывает, насколько эффективна виртуализация для данного списка.
   */
  const performanceStats = useMemo(() => {
    const totalItems = items.length;
    const renderedItems = visibleRange.visibleItems.length;
    const renderingEfficiency = totalItems > 0 ? (renderedItems / totalItems) * 100 : 0;

    return {
      totalItems,
      renderedItems,
      renderingEfficiency,
      memoryReduction: 100 - renderingEfficiency
    };
  }, [items.length, visibleRange.visibleItems.length]);

  return {
    // Основные данные для рендеринга
    visibleItems: visibleRange.visibleItems,
    totalHeight,
    
    // Обработчики событий
    onScroll: handleScroll,
    
    // Функции управления
    scrollToItem,
    updateContainerHeight,
    
    // Информация о состоянии
    scrollInfo,
    performanceStats,
    
    // Служебная информация (полезна для отладки)
    debug: {
      scrollTop,
      containerHeight,
      visibleRange: {
        start: visibleRange.startIndex,
        end: visibleRange.endIndex
      },
      itemPositions: itemPositions.slice(
        Math.max(0, visibleRange.startIndex - 2),
        Math.min(itemPositions.length, visibleRange.endIndex + 3)
      )
    }
  };
};

/**
 * Упрощенный хук для случаев, когда все элементы имеют одинаковую высоту
 * 
 * Это наиболее распространенный случай использования виртуализации.
 * Если все ваши элементы списка имеют одинаковую высоту, используйте этот хук.
 */
export const useSimpleVirtualization = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  return useVirtualization(items, {
    itemHeight,
    containerHeight,
    overscan
  });
};

/**
 * Хук для виртуализации с динамическими высотами элементов
 * 
 * Используется в случаях, когда элементы списка могут иметь разную высоту.
 * Например, комментарии разной длины или карточки с разным содержимым.
 */
export const useDynamicVirtualization = <T>(
  items: T[],
  getItemHeight: (index: number) => number,
  containerHeight: number,
  overscan: number = 3
) => {
  return useVirtualization(items, {
    itemHeight: 0, // Не используется при динамических высотах
    containerHeight,
    overscan,
    getItemHeight
  });
};

/**
 * Хук для автоматического определения размеров контейнера
 * 
 * Полезен для адаптивного дизайна, когда размер контейнера может изменяться.
 */
export const useResponsiveVirtualization = <T>(
  items: T[],
  itemHeight: number,
  overscan: number = 5
) => {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState(400); // Значение по умолчанию

  // Отслеживаем изменения размера контейнера
  useEffect(() => {
    if (!containerRef) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef);

    // Устанавливаем начальную высоту
    setContainerHeight(containerRef.offsetHeight);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  const virtualization = useVirtualization(items, {
    itemHeight,
    containerHeight,
    overscan
  });

  return {
    ...virtualization,
    containerRef: setContainerRef, // Функция для привязки к DOM элементу
    containerHeight
  };
};
