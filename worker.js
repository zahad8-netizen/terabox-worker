export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const videoId = url.searchParams.get('id');
    if (videoId) {
      return handleVideoPlayback(videoId);
    }

    if (request.method === 'POST') {
      try {
        const update = await request.json();
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const text = update.message.text.trim();

          if (text.includes('terabox')) {
            const match = text.match(/(?:s\/|id=)([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              const extractedId = match[1];
              const workerDomain = url.origin;
              const watchLink = `${workerDomain}/?id=${extractedId}`;
              
              await sendTelegramMessage(chatId, `⚡ ले भाई तेरा डायरेक्ट देखने वाला लिंक तैयार है:\n\n${watchLink}`);
            } else {
              await sendTelegramMessage(chatId, "❌ भाई सही Terabox लिंक भेज।");
            }
          } else {
            await sendTelegramMessage(chatId, "👋 मियाँ भाई! मुझे Terabox का लिंक भेज, मैं तुझे तुरंत ऑनलाइन चलने वाला डायरेक्ट लिंक देता हूँ।");
          }
        }
      } catch (e) {
        console.error(e);
      }
      return new Response('OK', { status: 200 });
    }

    return new Response(JSON.stringify({ error: true, message: "Worker is active and running perfectly!" }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }
};

async function handleVideoPlayback(videoId) {
  try {
    const apiUrl = `https://terabox.beer/api/terabox-new?link=https://terabox.com/s/${videoId}`;
    const apiRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const data = await apiRes.json();

    if (data && data.error === false) {
      const videoUrl = data.stream_download_url || data.url || (data.list && data.list[0] && data.list[0].dlink);
      
      if (videoUrl) {
        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Direct Video Player</title>
              <style>
                  body { background: #000; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; }
                  video { width: 100%; max-width: 900px; max-height: 90vh; outline: none; }
              </style>
          </head>
          <body>
              <video controls autoplay src="${videoUrl}"></video>
          </body>
          </html>
        `;
        return new Response(html, {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }
    }
    return new Response("Could not fetch playable video link", { status: 500 });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}

async function sendTelegramMessage(chatId, text) {
  const BOT_TOKEN = "8899795978:AAF9wEnQj4C-OPMI8Ozd_gWEjfmGBErMEpc";
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
 
  });
}
