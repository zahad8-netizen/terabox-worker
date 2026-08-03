import json
import requests

BOT_TOKEN = "8899795978:AAFsvo8TPPE60uPudNDNpqEpsro2NYqEASg"

def on_fetch(request, env, ctx):
    if request.method == "POST":
        try:
            # Request body read karo
            body = request.json()
            if "message" in body and ("text" in body["message"] or "caption" in body["message"]):
                msg = body["message"]
                chat_id = msg["chat"]["id"]
                text = msg.get("text") or msg.get("caption", "")

                # Agar TeraBox ka link hai
                if "/s/" in text:
                    parts = text.split("/s/")
                    video_id = parts[1].split(" ")[0].strip()
                    
                    # Worker ka khud ka URL ya direct streaming format
                    worker_url = request.url.split("?")[0]
                    watch_link = f"{worker_url}?id={video_id}"
                    
                    send_text(chat_id, f"⚡ Le bhai tera direct watch link:\n\n{watch_link}")
                else:
                    send_text(chat_id, "👋 Miyan bhai! Sahi TeraBox ka link bhej.")
        except Exception as e:
            pass
        return Response.text("OK")

    elif request.method == "GET":
        # Agar browser se direct watch link khulega
        url_param = request.url.split("?id=")
        if len(url_param) > 1:
            video_id = url_param[1].split("&")[0]
            original_link = f"https://1024terabox.com/s/{video_id}"
            
            # HTML redirect taaki video link chal jaye
            html = f'''<!DOCTYPE html>
            <html>
            <head><meta http-equiv="refresh" content="0;url={original_link}"></head>
            <body>Redirecting to video...</body>
            </html>'''
            return Response(html, headers={"Content-Type": "text/html"})

    return Response("Bot is running perfectly!")

def send_text(chat_id, text):
    api_url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "disable_web_page_preview": True
    }
    requests.post(api_url, json=payload)
