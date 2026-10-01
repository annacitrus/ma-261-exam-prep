import json,re,io,base64
import pdfplumber
from pathlib import Path
from question_bank import BANK,KEYS,TOPICS
assert len(BANK)==84
assert len(set(q['id'] for q in BANK))==84
for exam,key in KEYS.items():
    qs=[q for q in BANK if q['exam']==exam]
    assert len(qs)==12 and len(key)==12,exam
    assert ''.join(chr(q['answer']+65) for q in qs)==key
    assert all(len(q['options'])==(6 if exam in ['s2022','s2025'] else 5) for q in qs),exam
root=Path(__file__).resolve().parents[1]
path=root/'index.html'
html=path.read_text(encoding='utf-8')
figures={
 'spiral':('f2023',3,(70,375,245,537),'A curve spiraling outward in a horizontal plane above the xy-plane.'),
 'levels':('s2022',3,(72,97,198,220),'Level curves forming hyperbolas opening along the x and y directions, with crossing straight lines at the central level.'),
 'cone':('s2022',5,(72,378,265,515),'An elliptic cone centered at the origin, with two halves extending along the positive and negative x-axis.')
}
for q in BANK:
    if q['figure']:
        exam,page,bbox,alt=figures[q['figure']]
        with pdfplumber.open(Path('C:/Users/acitr/Downloads')/f'26100e1-{exam}.pdf') as pdf:
            im=pdf.pages[page].crop(bbox).to_image(resolution=180).original
            stream=io.BytesIO();im.save(stream,format='PNG')
            q['figure']={'src':'data:image/png;base64,'+base64.b64encode(stream.getvalue()).decode(),'alt':alt}
data=json.dumps(BANK,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
html=re.sub(r'(<script id="question-data" type="application/json">).*?(</script>)',lambda m:m[1]+data+m[2],html,flags=re.S)
path.write_text(html,encoding='utf-8')
print('Embedded',len(BANK),'questions; HTML bytes:',path.stat().st_size)
print({TOPICS[t]:sum(q['topic']==t for q in BANK) for t in TOPICS})
