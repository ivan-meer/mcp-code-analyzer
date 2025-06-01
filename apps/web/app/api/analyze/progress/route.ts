import { NextRequest } from 'next/server';
import { calculateFileHash } from '@/lib/hash-utils';
import type { DuplicateGroup } from '@/types/analysis.types';

let lastProgress: { [key: string]: any } = {};
let fileHashes: Map<string, string> = new Map();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('id');
  if (!projectId) {
    return new Response('Missing project id', { status: 400 });
  }

  // Устанавливаем заголовки для SSE
  const stream = new ReadableStream({
    async start(controller) {
      if (!projectId) {
        controller.close();
        return;
      }
      // Функция для отправки прогресса с проверкой состояния контроллера
      function sendProgress(progress: any) {
        try {
          if (!controller || controller.desiredSize === null) {
            console.log('Контроллер уже закрыт, пропускаем отправку прогресса');
            return;
          }
          controller.enqueue(`data: ${JSON.stringify(progress)}\n\n`);
        } catch (error) {
          console.error('Ошибка при отправке прогресса:', error);
        }
      }

      // Отправляем последний известный прогресс (если есть)
      if (projectId && lastProgress[projectId]) {
        sendProgress(lastProgress[projectId]);
      }

      // Таймер для периодической проверки соединения
      const heartbeatInterval = setInterval(() => {
        try {
          if (controller.desiredSize !== null) {
            controller.enqueue(`: heartbeat\n\n`);
          } else {
            clearInterval(heartbeatInterval);
          }
        } catch (error) {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Подключаемся к SSE потоку нового Node.js SSE сервера через fetch
      // Нормализуем projectId и проверяем его валидность
      const normalizedProjectId = projectId.replace(/\\/g, '/').trim();
      if (!normalizedProjectId || normalizedProjectId.includes('..')) {
        console.error('Invalid project path:', normalizedProjectId);
        controller.close();
        return;
      }

      // Инициализация анализа дубликатов
      fileHashes = new Map();

      const response = await fetch(`http://localhost:8000/api/analyze/progress/${encodeURIComponent(normalizedProjectId)}`, {
        headers: {
          'Accept': 'text/event-stream',
        }
      });

      if (!response.ok || !response.body) {
        controller.close();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

async function readStream() {
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        clearInterval(heartbeatInterval);
        if (controller.desiredSize !== null) {
          controller.close();
        }
        return;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const progress = JSON.parse(line.replace('data:', '').trim());
            if (projectId) {
              lastProgress[projectId] = progress;
            }
            sendProgress(progress);

            if (progress.status === 'completed') {
              // Добавляем информацию о дубликатах перед завершением
              const duplicates = findDuplicates(fileHashes);
              if (duplicates.length > 0) {
                progress.file_duplicates = duplicates;
                sendProgress(progress);
              }

              clearInterval(heartbeatInterval);
              if (controller.desiredSize !== null) {
                controller.close();
              }
              return;
            }
          } catch (error) {
            console.error('Ошибка обработки сообщения:', error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Ошибка чтения потока:', error);
    clearInterval(heartbeatInterval);
    if (controller.desiredSize !== null) {
      controller.close();
    }
  }
}

      readStream();

      return () => {
        clearInterval(heartbeatInterval);
        try {
          reader.cancel();
          controller.close();
        } catch (error) {
          console.log('Ошибка при очистке:', error);
        }
      };
    },
    cancel() {
      // cleanup if needed
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

export function updateProgress(projectId: string, progress: any) {
  lastProgress[projectId] = progress;
}

function findDuplicates(hashes: Map<string, string>) {
  const hashMap: Map<string, string[]> = new Map();
  const duplicates: DuplicateGroup[] = [];

  // Собираем группы файлов с одинаковыми хешами
  hashes.forEach((hash, filePath) => {
    if (!hashMap.has(hash)) {
      hashMap.set(hash, [filePath]);
    } else {
      hashMap.get(hash)!.push(filePath);
    }
  });

  // Преобразуем в формат DuplicateGroup
  hashMap.forEach((files, hash) => {
    if (files.length > 1) {
      duplicates.push({
        hash,
        size: 0, // TODO: добавить реальный размер файла
        files: files.map(path => ({
          path,
          lines: [] // TODO: добавить номера строк дубликатов
        }))
      });
    }
  });

  return duplicates;
}
