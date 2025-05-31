import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Здесь будет логика получения статуса ИИ
    // Пока возвращаем заглушку для тестирования
    const aiStatus = {
      status: 'operational',
      lastUpdated: new Date().toISOString(),
    };

    res.status(200).json(aiStatus);
  } catch (error) {
    console.error('Error in /api/ai-status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}