import json
from pathlib import Path
import pdfplumber

root = Path(__file__).resolve().parent
downloads = Path('C:/Users/acitr/Downloads')
exams = ['f2022','f2023','f2024','s2022','s2023','s2024','s2025']
for exam in exams:
    for prefix in ['', 'ans-']:
        name = f'{prefix}26100e1-{exam}'
        with pdfplumber.open(downloads / f'{name}.pdf') as pdf:
            pages = [page.extract_text(layout=False) or '' for page in pdf.pages]
            (root / f'{name}.txt').write_text('\n\n'.join(f'PAGE {i+1}\n{p}' for i,p in enumerate(pages)),encoding='utf-8')
            print(name, 'pages:',len(pages),'characters:',sum(map(len,pages)))
            if not prefix:
                for i,page in enumerate(pdf.pages):
                    if i > 0:
                        page.to_image(resolution=105).save(root / f'{exam}-{i+1}.png')
            else:
                print('\n'.join(pages))
