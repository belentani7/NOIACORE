from html.parser import HTMLParser
from pathlib import Path

class NOIAParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
        self.inside_script = False
        self.preview_is_isolated = False
        self.has_title = False
    def handle_starttag(self, tag, attrs):
        props = dict(attrs)
        if tag == "script":
            self.inside_script = True
        if tag == "iframe" and props.get("id") == "preview-frame":
            self.preview_is_isolated = props.get("sandbox") == "allow-scripts"
        if tag == "title":
            self.has_title = True
    def handle_data(self, data):
        if self.inside_script:
            self.scripts.append(data)
    def handle_endtag(self, tag):
        if tag == "script":
            self.inside_script = False

root = Path(__file__).parent
source = (root / "index.html").read_text(encoding="utf-8")
parser = NOIAParser()
parser.feed(source)
assert parser.has_title, "NOIA page title missing"
assert parser.preview_is_isolated, "Studio must use sandbox=allow-scripts"
assert len(source) > 80000, "NOIA source appears truncated"
assert "https://noia-os.vercel.app" not in source, "Deployment URLs must never be fabricated"
script = "\n".join(parser.scripts)
assert "function verifyWorkspace()" in script, "Workspace verification missing"
assert "SKILL RUN FAILED" in script, "NoiaSkills must stop on failure"
assert "renderDex" in script and "renderPreview" in script, "Functional modules missing"
(root / "inline-ci.js").write_text(script, encoding="utf-8")
print("NOIA static checks passed")
