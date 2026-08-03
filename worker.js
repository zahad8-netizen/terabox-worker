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
              const watchLink = `${url.origin}/?id=${match[1]}`;
              await sendTelegramMessage(chatId, `⚡ ले भाई तेरा M3U8 वॉच लिंक तैयार है:\n\n${watchLink}`);
            } else {
              await sendTelegramMessage(chatId, "❌ भाई सही Terabox लिंक भेज।");
            }
          } else {
            await sendTelegramMessage(chatId, "👋 मियाँ भाई! मुझे Terabox का लिंक भेज।");
          }
        }
      } catch (e) {}
      return new Response('OK', { status: 200 });
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }
};

async function handleVideoPlayback(videoId) {
  try {
    const apiUrl = `https://terabox.beer/api/terabox-new?link=${encodeURIComponent(`https://terabox.com/s/${videoId}`)}`;
    const apiRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }
    });
    const data = await apiRes.json();

    if (data && !data.error) {
      const videoUrl = data.stream_download_url || data.download_link || data.url || data.video_url;
      if (videoUrl) {
        return Response.redirect(videoUrl, 302);
      }
    }
    return new Response("Stream error", { status: 500 });
  } catch (err) {
    return new Response("Error", { status: 500 });
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
