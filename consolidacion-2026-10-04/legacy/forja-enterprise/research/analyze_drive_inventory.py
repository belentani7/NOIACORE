from pathlib import Path
import json
import re
import pandas as pd

root = Path('/home/ubuntu/forja-enterprise/research/drive_master')
input_path = root / 'ARCHIVOS-POR-PROYECTO.csv'
df = pd.read_csv(input_path)
for column in ['Proyecto', 'Acceso', 'Tipo', 'Archivo', 'Ubicacion', 'Raiz', 'Atajo', 'EstadoAtajo']:
    df[column] = df[column].fillna('').astype(str)
df['Bytes'] = pd.to_numeric(df['Bytes'], errors='coerce').fillna(0).astype('int64')
terms = ['duck', 'forja', 'noiacore', 'lumina', 'lúmina', 'belentani']
pattern = '|'.join(re.escape(term) for term in terms)
related = df[df[['Proyecto', 'Archivo', 'Ubicacion', 'Raiz', 'Atajo']].agg(' '.join, axis=1).str.lower().str.contains(pattern, regex=True, na=False)].copy()
related['Extension'] = related['Archivo'].str.extract(r'(\.[A-Za-z0-9]{1,12})$', expand=False).fillna('[sin_extensión]').str.lower()
project_summary = (related.groupby('Proyecto', dropna=False).agg(files=('Archivo', 'size'), bytes=('Bytes', 'sum'), access=('Acceso', lambda values: ','.join(sorted(set(values)))), extensions=('Extension', lambda values: ','.join(sorted(set(values))))) .reset_index().sort_values(['files', 'bytes'], ascending=False))
extension_summary = related.groupby(['Proyecto', 'Extension']).size().reset_index(name='files').sort_values(['Proyecto', 'files'], ascending=[True, False])
access_summary = related.groupby(['Proyecto', 'Acceso']).size().reset_index(name='files')
keyword_file_hits = related[related['Archivo'].str.lower().str.contains(pattern, regex=True, na=False)][['Proyecto','Archivo','Tipo','Acceso','Bytes','Modificado']].drop_duplicates().sort_values(['Proyecto','Archivo'])
summary = {
    'source': str(input_path),
    'total_rows': int(len(df)),
    'related_rows': int(len(related)),
    'related_project_count': int(related['Proyecto'].nunique()),
    'related_projects': project_summary.to_dict(orient='records'),
    'access_counts': access_summary.to_dict(orient='records'),
    'keyword_file_hits': keyword_file_hits.to_dict(orient='records'),
}
(root / 'drive_inventory_summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
project_summary.to_csv(root / 'drive_related_projects.csv', index=False)
extension_summary.to_csv(root / 'drive_related_extensions.csv', index=False)
access_summary.to_csv(root / 'drive_related_access.csv', index=False)
keyword_file_hits.to_csv(root / 'drive_keyword_file_hits.csv', index=False)
print(json.dumps({'total_rows': len(df), 'related_rows': len(related), 'related_project_count': int(related['Proyecto'].nunique())}, ensure_ascii=False))
print(project_summary.head(30).to_string(index=False))
