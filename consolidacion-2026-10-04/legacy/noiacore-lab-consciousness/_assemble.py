import re

SRC = r"C:\Users\USER\belentani-neural-icons-review\_incoming_intro_clean.html"
DST = r"C:\Users\USER\noiacore-lab\index.html"

with open(SRC, "r", encoding="utf-8") as f:
    html = f.read()

# Strip the ~14 repeated bogus placeholder background-image style attrs that
# SingleFile injected on every <canvas> (all byte-identical dead weight —
# real rendering happens via JS draw calls, not a CSS background-image).
placeholder_re = re.compile(
    r'\s*style="background-blend-mode:normal!important;.*?background-repeat:no-repeat!important"'
)
html, n = placeholder_re.subn("", html)
print("stripped placeholder style attrs:", n)

# The page's own CSP is script-src/style-src 'unsafe-inline' only (no
# external hosts at all) -- it was built single-file on purpose, so no
# Google Fonts link here. Add only the one missing CSS rule the
# reveal-on-scroll JS needs (the stylesheet only defined the *hidden*
# state, never the revealed one) right before </head>.
head_addition = (
    '<style>.reveal.in{opacity:1;transform:none;filter:none}'
    '@keyframes liquid-gold-pulse{0%,100%{filter:drop-shadow(0 0 4px rgba(232,179,77,.7))}'
    '50%{filter:drop-shadow(0 0 12px rgba(232,179,77,1))}}'
    '.liquid-gold-pulse{animation:liquid-gold-pulse 2.4s ease-in-out infinite}</style>'
    '</head>'
)
html, n = html.replace('</head>', head_addition, 1), html.count('</head>')
assert n == 1, f"expected exactly one </head>, found {n}"

# Inline the engine (an external <script src> is blocked by this same
# CSP -- it only allows 'unsafe-inline' -- and it keeps the page a
# single self-contained file, matching how the rest of this artifact
# was built).
with open(r"C:\Users\USER\noiacore-lab\engine.js", "r", encoding="utf-8") as f:
    engine_js = f.read()

html = html.rstrip() + '\n<script>\n' + engine_js + '\n</script>\n</body>\n</html>\n'

with open(DST, "w", encoding="utf-8") as f:
    f.write(html)

print("wrote", DST, "-", len(html), "chars")
