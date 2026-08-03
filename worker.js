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
              
              await sendTelegramMessage(chatId, `⚡ ले भाई तेरा एकदम पक्का M3U8 वॉच लिंक तैयार है:\n\n${watchLink}`);
            } else {
              await sendTelegramMessage(chatId, "❌ भाई सही Terabox लिंक भेज।");
            }
          } else {
            await sendTelegramMessage(chatId, "👋 मियाँ भाई! मुझे Terabox का लिंक भेज, मैं तुझे तुरंत M3U8 डायरेक्ट लिंक देता हूँ।");
          }
        }
      } catch (e) {
        console.error(e);
      }
      return new Response('OK', { status: 200 });
    }

    return new Response(JSON.stringify({ status: "success", version: "MOBILE_FIXED_V6" }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }
};

async function handleVideoPlayback(videoId) {
  try {
    const teraboxFullLink = `https://terabox.com/s/${videoId}`;
    const apiUrl = `https://terabox.beer/api/terabox-new?link=${encodeURIComponent(teraboxFullLink)}`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://terabox.beer/'
    };

    const apiRes = await fetch(apiUrl, { headers });
    const textData = await apiRes.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch (e) {
      return new Response("API returned non-JSON response", { status: 500 });
    }

    if (data && data.error === false) {
      let videoUrl = data.stream_download_url || data.download_link || data.fallback_url || data.proxy_url || data.url || data.video_url;
      
      if (!videoUrl && data.list && data.list[0]) {
        videoUrl = data.list[0].dlink || data.list[0].url;
      }

      if (videoUrl) {
        let finalM3u8Url = videoUrl;
        let currentUrl = videoUrl;
        
        for (let i = 0; i < 5; i++) {
          try {
            const redirectRes = await fetch(currentUrl, {
              method: 'GET',
              headers: { ...headers, 'Referer': 'https://terabox.beer/' },
              redirect: 'manual'
            });

            if ([301, 302, 303, 307, 308].includes(redirectRes.status)) {
              const location = redirectRes.headers.get('Location');
              if (location) {
                currentUrl = location.startsWith('http') ? location : new URL(location, currentUrl).href;
                continue;
              }
            }

            const htmlText = await redirectRes.text();
            const m3u8Match = htmlText.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/);
                              
            if (m3u8Match) {
              finalM3u8Url = m3u8Match[0];
              break;
            }
            break;
          } catch (err) {
            break;
          }
        }

        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>TeraBox Fast Player</title>
              <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
              <style>
                  body { background: #000; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; }
                  video { width: 100%; max-width: 1000px; max-height: 100vh; outline: none; }
              </style>
          </head>
          <body>
              <video id="video" controls autoplay></video>
              <script>
                  var video = document.getElementById('video');
                  var videoSrc = "${finalM3u8Url}";
                  if (Hls.isSupported()) {
                      var hls = new Hls();
                      hls.loadSource(videoSrc);
                      hls.attachMedia(video);
                      hls.on(Hls.Events.MANIFEST_PARSED, function() {
                          video.play();
                      });
                  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                      video.src = videoSrc;
                      video.addEventListener('loadedmetadata', function() {
                          video.play();
                      });
                  }
              </script>
          </body>
          </html>
        `;
        return new Response(html, {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }
    }
    return new Response("Could not extract stream link", { status: 500 });
  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 });
  }
}

async function sendTelegramMessage(chatId, text) {
  const BOT_TOKEN = "8899795978:AAF9wEnQj4C-OPMI8Ozd_gWEjfmGBErMEpc";
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text
                         })
  });
}
