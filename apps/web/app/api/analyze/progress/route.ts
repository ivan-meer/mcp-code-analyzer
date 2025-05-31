import { NextRequest } from 'next/server';

let lastProgress: { [key: string]: any } = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('id');
  if (!projectId) {
    return new Response('Missing project id', { status: 400 });
  }

  // Устанавливаем заголовки для SSE
  const stream = new ReadableStream({
    start(controller) {
      // Функция для отправки прогресса
      function sendProgress(progress: any) {
        controller.enqueue(`data: ${JSON.stringify(progress)}\n\n`);
      }

      // Отправляем последний известный прогресс (если есть)
      if (lastProgress[projectId]) {
        sendProgress(lastProgress[projectId]);
      }

      // Пример: эмулируем прогресс (MVP, потом заменим на реальный)
      let percent = 0;
      const interval = setInterval(() => {
        percent += 10;
        const progress = { id: projectId, percentage: percent, status: percent < 100 ? 'analyzing' : 'completed' };
        lastProgress[projectId] = progress;
        sendProgress(progress);
        if (percent >= 100) {
          clearInterval(interval);
          controller.close();
        }
      }, 1000);

      // TODO: заменить на реальный поток прогресса из CodeAnalyzer
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

// В будущем: функцию для обновления прогресса из CodeAnalyzer
export function updateProgress(projectId: string, progress: any) {
  lastProgress[projectId] = progress;
}
