import os, base64, json, urllib.request, urllib.error
def b64(p):
    with open(p,"rb") as f:
        return base64.b64encode(f.read()).decode()
imgs = [
    r"C:\Users\USER\Downloads\NOI\ChatGPT Image 27 jul 2026, 18_41_35.png",
    r"C:\Users\USER\Downloads\NOI\ChatGPT Image 27 jul 2026, 18_42_23.png",
    r"C:\Users\USER\Downloads\NOI\ChatGPT Image 27 jul 2026, 18_42_54.png",
]
def try_sf():
    key = os.environ["SILICONFLOW_LIBRE_API_KEY"]
    content = []
    for p in imgs:
        content.append({"type":"image_url","image_url":{"url":"data:image/png;base64,"+b64(p)}})
    content.append({"type":"text","text":"Describe estas 3 imagenes del concepto NOIACORE en espanol. Para CADA una (IMG_1,2,3): que se ve, estetica, paleta, si hay un OJO describelo. Luego como convertirlo en componente web 'Evil Eye'."})
    body={"model":"Qwen/Qwen2.5-VL-72B-Instruct","messages":[{"role":"user","content":content}],"max_tokens":2500}
    req=urllib.request.Request("https://api.siliconflow.cn/v1/chat/completions",
        data=json.dumps(body).encode(), headers={"Content-Type":"application/json","Authorization":"Bearer "+key})
    with urllib.request.urlopen(req, timeout=180) as r:
        d=json.load(r)
    return d["choices"][0]["message"]["content"]
def try_or():
    key = os.environ["OPENROUTER_LIBRE_API_KEY"]
    content = []
    for p in imgs:
        content.append({"type":"image_url","image_url":{"url":"data:image/png;base64,"+b64(p)}})
    content.append({"type":"text","text":"Describe estas 3 imagenes del concepto NOIACORE en espanol. Para CADA una (IMG_1,2,3): que se ve, estetica, paleta, si hay un OJO describelo. Luego como convertirlo en componente web 'Evil Eye'."})
    body={"model":"qwen/qwen-2.5-vl-72b-instruct","messages":[{"role":"user","content":content}],"max_tokens":2500}
    req=urllib.request.Request("https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(body).encode(), headers={"Content-Type":"application/json","Authorization":"Bearer "+key})
    with urllib.request.urlopen(req, timeout=180) as r:
        d=json.load(r)
    return d["choices"][0]["message"]["content"]
for name, fn in [("SILICONFLOW", try_sf), ("OPENROUTER", try_or)]:
    try:
        print("====", name, "OK ====")
        print(fn())
        break
    except urllib.error.HTTPError as e:
        print("====", name, "HTTP", e.code, "====")
        print(e.read().decode()[:800])
    except Exception as e:
        print("====", name, "ERR", e, "====")
