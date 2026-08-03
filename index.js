export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const videoId = url.searchParams.get('id');


    if (!videoId) {
      return new Response(JSON.stringify({ error: true, message: "Please provide a valid video id (?id=...)" }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }


    try {
      const apiUrl = `https://terabox.beer/api/terabox-new?link=https://terabox.com/s/${videoId}`;
      const apiRes = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10)'
        }
      });
      const data = await apiRes.json();


      if (data && data.error === false) {
        const streamUrl = data.stream_download_url || data.url || data.download_link;
        if (streamUrl) {
          return Response.redirect(streamUrl, 302);
        }
      }
      
      return new Response(JSON.stringify({ error: true, message: "Failed to fetch video link" }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: true, message: err.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }
};