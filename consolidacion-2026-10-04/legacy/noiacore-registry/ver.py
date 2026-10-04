import os, base64, json, sys, urllib.request, urllib.error, io
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
def b64(p, max_side=768, quality=80):
    if HAS_PIL:
        im = Image.open(p).convert("RGB")
        w, h = im.size
        scale = min(1.0, max_side / max(w, h))
        if scale < 1.0:
            im = im.resize((int(w*scale), int(h*scale)))
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=quality)
        return base64.b64encode(buf.getvalue()).decode(), "image/jpeg"
    with open(p, "rb") as f:
        return base64.b64encode(f.read()).decode(), "image/png"
def main():
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        print("ERROR: OPENROUTER_API_KEY no definida"); sys.exit(1)
    args = sys.argv[1:]
    model = "qwen/qwen-2.5-vl-72b-instruct"
    prompt = "Describe en espanol."
    if args and not os.path.exists(args[0]):
        model = args.pop(0)
    if args and not os.path.exists(args[0]):
        prompt = args.pop(0)
    if not args:
        print("ERROR: sin imagenes"); sys.exit(1)
    content = []
    for p in args:
        data, mime = b64(p)
        content.append({"type": "image_url", "image_url": {"url": "data:%s;base64,%s" % (mime, data)}})
    content.append({"type": "text", "text": prompt})
    body = {"model": model, "messages": [{"role": "user", "content": content}], "max_tokens": 900}
    req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + key})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            d = json.load(r)
        print(d["choices"][0]["message"]["content"])
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode()[:900])
if __name__ == "__main__":
    main()
