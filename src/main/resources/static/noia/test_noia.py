"""Zero-dependency NOIA static integrity checks, suitable for GitHub Actions."""
from html.parser import HTMLParser
from pathlib import Path

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts=[]
        self.script=False
        self.has_title=False
        self.isolated=False
    def handle_starttag(self,tag,attrs):
        props=dict(attrs)
        if tag=='script':self.script=True
        if tag=='title':self.has_title=True
        if tag=='iframe' and props.get('id')=='preview-frame':
            self.isolated=props.get('sandbox')=='allow-scripts'
    def handle_data(self,data):
        if self.script:self.scripts.append(data)
    def handle_endtag(self,tag):
        if tag=='script':self.script=False

root=Path(__file__).parent
source=(root/'index.html').read_text(encoding='utf-8')
html=Document();html.feed(source)
assert html.has_title, 'title missing'
assert html.isolated, 'Studio iframe must run in an opaque sandbox'
assert len(source)>90000, 'Source truncated'
assert source.count('<script>')==1, 'Expected a single, embedded application script'
code='\n'.join(html.scripts)
required={
 'workspace integrity':'function verifyWorkspace()',
 'safe skill failure':'SKILL RUN FAILED',
 'file search':'function renderDex(',
 'isolated preview':'function renderPreview()',
 'recovery data quarantine':'const RECOVERY_KEY',
 'draft key':'const DRAFT_KEY',
 'draft recovery':'function recoverDraft()',
 'draft export':'function exportDraft()',
 'editor blocking on failed save':'if(!safeUI(saveActiveIfDirty))return false',
 'confirm before destructive restore':"confirm('Replace your current local files",
 'preview CSP':"connect-src 'none'",
 'storage error signal':'STORAGE ERROR',
 'native reload warning':'beforeunload',
 'bounded commands':'SAFE_SKILL_COMMANDS'
}
for name,needle in required.items():
    assert needle in code,f'Missing {name}'
assert 'https://noia-os.vercel.app' not in source, 'Fabricated deployment URL'
(root/'inline-ci.js').write_text(code,encoding='utf-8')
print(f'NOIA 1.3 static checks passed: {len(required)+4} assertions')
