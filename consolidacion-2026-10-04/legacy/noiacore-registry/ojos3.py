import os, base64, json, urllib.request, urllib.error
def b64(p):
    with open(p,"rb") as f:
        return base64.b64encode(f.read()).decode()
imgs = [
    r"C:\Users\USER\Downloads\NOI\ChatGPT Image 27 jul 2026, 18_41_35.png",
    r"C:\Users\USER\Downloads\NOI\ChatGPT Image 27 jul 2026, 18_42_23.png",
    r"C:\Users\USER\Downloads\NOI\ChatGPT Image 27 jul 2026, 18_42_54.png",
]
PROMPT = "Describe estas 3 imagenes del concepto NOIACORE en espanol. Para CADA una (IMG_1,2,3): que se ve, estetica, paleta de colores, y si hay un OJO describelo en detalle. Luego di como convertirlo en componente web 'Evil Eye' para marca de IA."
def g_post(url, headers, body):
    req=urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers)
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.load(r)
def try_gemini():
    key=os.environ["GEMINI_LIBRE_API_KEY"]
    parts=[]
    for p in imgs:
        parts.append({"inline_data":{"mime_type":"image/png","data":b64(p)}})
    parts.append({"text":PROMPT})
    d=g_post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+key,{"Content-Type":"application/json"},{"contents":[{"parts":parts}]})
    return d["candidates"][0]["content"]["parts"][0]["text"]
def try_dash():
    key=os.environ["DASHSCOPE_LIBRE_API_KEY"]
    content=[]
    for p in imgs:
        content.append({"image":"file://"+p})
    content.append({"text":PROMPT})
    d=g_post("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        {"Content-Type":"application/json","Authorization":"Bearer "+key},
        {"model":"qwen-vl-max","messages":[{"role":"user","content":content}],"max_tokens":2500})
    return d["choices"][0]["message"]["content"]
def try_groq():
    key=os.environ["GROQ_LIBRE_API_KEY"]
    content=[]
    for p in imgs:
        content.append({"type":"image_url","image_url":{"url":"data:image/png;base64,"+b64(p)}})
    content.append({"type":"text","text":PROMPT})
    d=g_post("https://api.groq.com/openai/v1/chat/completions",
        {"Content-Type":"application/json","Authorization":"Bearer "+key},
        {"model":"llama-3.2-90b-vision-preview","messages":[{"role":"user","content":content}],"max_tokens":2500})
    return d["choices"][0]["message"]["content"]
def try_nvidia():
    key=os.environ["NVIDIA_LIBRE_API_KEY"]
    content=[]
    for p in imgs:
        content.append({"type":"image_url","image_url":{"url":"data:image/png;base64,"+b64(p)}})
    content.append({"type":"text","text":PROMPT})
    d=g_post("https://integrate.api.nvidia.com/v1/chat/completions",
        {"Content-Type":"application/json","Authorization":"Bearer "+key},
        {"model":"meta/llama-3.2-90b-vision-instruct","messages":[{"role":"user","content":content}],"max_tokens":2500})
    return d["choices"][0]["message"]["content"]
def try_hf():
    key=os.environ["HF_LIBRE_TOKEN"]
    content=[]
    for p in imgs:
        content.append({"type":"image_url","image_url":{"url":"data:image/png;base64,"+b64(p)}})
    content.append({"type":"text","text":PROMPT})
    d=g_post("https://api-inference.huggingface.co/models/Qwen/Qwen2.5-VL-72B-Instruct",
        {"Content-Type":"application/json","Authorization":"Bearer "+key},
        {"messages":[{"role":"user","content":content}],"max_tokens":2500})
    if isinstance(d, dict) and "choices" in d:
        return d["choices"][0]["message"]["content"]
    return json.dumps(d)[:500]
def try_or2():
    key=os.environ["OPENROUTER_API_KEY"]
    content=[]
    for p in imgs:
        content.append({"type":"image_url","image_url":{"url":"data:image/png;base64,"+b64(p)}})
    content.append({"type":"text","text":PROMPT})
    d=g_post("https://openrouter.ai/api/v1/chat/completions",
        {"Content-Type":"application/json","Authorization":"Bearer "+key},
        {"model":"qwen/qwen-2.5-vl-72b-instruct","messages":[{"role":"user","content":content}],"max_tokens":2500})
    return d["choices"][0]["message"]["content"]
for name, fn in [("GEMINI",try_gemini),("DASHSCOPE",try_dash),("GROQ",try_groq),("NVIDIA",try_nvidia),("HF",try_hf),("OPENROUTER2",try_or2)]:
    try:
        print("====", name, "OK ====")
        print(fn())
        break
    except urllib.error.HTTPError as e:
        print("====", name, "HTTP", e.code, "====")
        print(e.read().decode()[:400])
    except Exception as e:
        print("====", name, "ERR", repr(e)[:300], "====")
