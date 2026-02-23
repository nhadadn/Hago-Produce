export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error('Telegram sendMessage request failed');
  }
}

