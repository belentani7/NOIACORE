import os, base64, json, urllib.request, sys
key = os.environ["GEMINI_API_KEY"]
imgs = [
    r"C:\Users\USER\Downloads\NOI\ChatGPT Image 27 jul 2026, 18_41_35.png",
    r"C:\Users\USER\Downloads\NOI\ChatGPT Image 27 jul 2026, 18_42_23.png",
    r"C:\Users\USER\Downloads\NOI\ChatGPT Image 27 jul 2026, 18_42_54.png",
]
def b64(p):
    with open(p,"rb") as f:
        return base64.b64encode(f.read()).decode()
parts=[]
for i,p in enumerate(imgs):
    parts.append({"inline_data":{"mime_type":"image/png","data":b64(p)}})
parts.append({"text":"Describe estas 3 imagenes del concepto NOIACORE en espanol. Para CADA una (IMG_1, IMG_2, IMG_3): 1) Que se ve (elementos visuales) 2) Estetica/estilo 3) Paleta de colores 4) Si hay un OJO o simbolo, describelo en detalle. Luego di como podria convertirse en un componente web/landing de 'Evil Eye' para una marca de IA."})
body={"contents":[{"parts":parts}]}
req=urllib.request.Request(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+key,
    data=json.dumps(body).encode(),
    headers={"Content-Type":"application/json"})
try:
    with urllib.request.urlopen(req, timeout=120) as r:
        d=json.load(r)
    txt=d["candidates"][0]["content"]["parts"][0]["text"]
    print(txt)
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode()[:2000])
