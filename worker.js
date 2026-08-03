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
              
              await sendTelegramMessage(chatId, `⚡ ले भाई तेरा एकदम पक्का डायरेक्ट वॉच लिंक तैयार है:\n\n${watchLink}`);
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
    const teraboxFullLink = `https://terabox.com/s/${videoId}`;
    const apiUrl = `https://terabox.beer/api/terabox-new?link=${encodeURIComponent(teraboxFullLink)}`;
    
    const apiRes = await fetch(apiUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://terabox.beer/'
      }
    });
    const data = await apiRes.json();

    if (data && data.error === false) {
      let videoUrl = data.stream_download_url || data.download_link || data.fallback_url || data.proxy_url || data.url || data.video_url;
      
      if (!videoUrl && data.list && data.list[0]) {
        videoUrl = data.list[0].dlink || data.list[0].url;
      }

      if (videoUrl) {
        // रीडायरेक्ट या m3u8 चेक करने के लिए
        let finalVideoUrl = videoUrl;
        try {
          const redirectRes = await fetch(videoUrl, {
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            redirect: 'follow'
          });
          const text = await redirectRes.text();
          const m3u8Match = text.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/);
          if (m3u8Match && m3u8Match[1]) {
            finalVideoUrl = m3u8Match[1];
          } else if (redirectRes.url) {
            finalVideoUrl = redirectRes.url;
          }
        } catch (err) {
          // अगर रीडायरेक्ट चेक फेल हो तो ओरिजिनल यूआरएल यूज़ करेगा
        }

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
              <video controls autoplay src="${finalVideoUrl}"></video>
          </body>
          </html>
        `;
        return new Response(html, {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }
    }
    return new Response("Could not fetch playable video link from API", { status: 500 });
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
