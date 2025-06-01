import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

/**
 * Вычисляет хеш содержимого файла
 * @param filePath Полный путь к файлу
 * @param algorithm Алгоритм хеширования (по умолчанию sha256)
 * @returns Промис с хешем файла
 */
export async function calculateFileHash(
  filePath: string, 
  algorithm: string = 'sha256'
): Promise<string> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash(algorithm);
    hashSum.update(fileBuffer);
    
    return hashSum.digest('hex');
  } catch (error) {
    console.error(`Ошибка при вычислении хеша файла ${filePath}:`, error);
    throw error;
  }
}

/**
 * Фильтрует файлы по настройкам из mcp_settings.json
 * @param filePath Путь к файлу
 * @param minSize Минимальный размер файла в байтах
 * @param ignoreExtensions Расширения для игнорирования
 * @returns true если файл должен быть обработан
 */
export function shouldProcessFile(
  filePath: string,
  minSize: number,
  ignoreExtensions: string[]
): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return !ignoreExtensions.includes(ext);
}

/**
 * Группирует файлы по их хешам для поиска дубликатов
 * @param files Массив путей к файлам
 * @returns Map с хешами и списками файлов
 */
export async function groupFilesByHash(
  files: string[],
  algorithm: string = 'sha256'
): Promise<Map<string, string[]>> {
  const hashGroups = new Map<string, string[]>();
  
  for (const file of files) {
    try {
      const hash = await calculateFileHash(file, algorithm);
      if (!hashGroups.has(hash)) {
        hashGroups.set(hash, [file]);
      } else {
        hashGroups.get(hash)?.push(file);
      }
    } catch (error) {
      console.error(`Пропуск файла ${file} из-за ошибки:`, error);
    }
  }

  return hashGroups;
}