"""Build conservative word-position lookups from the unmodified QAC v0.4 source."""
import collections, hashlib, json, pathlib, re, unicodedata
root = pathlib.Path(__file__).resolve().parent.parent
source = root / 'public/data/grammar/source.txt'
# Standard Buckwalter alphabet, including Quranic annotation characters.
bw = dict(zip("'>&<}AbptvjHxd*rzs$SDTZEg_fqklmnhwYyFNKaui~o^#`{:@\"[;,.!-+%]", "ءأؤإئا بةتثجحخدذرزسشصضطظعغـفقكلمنهوىيًٌٍَُِّْٰٓٔٱۣۜ۟۠ۢۥۦ۪ۭۨ۫۬".replace(' ','')))
def arabic(s): return ''.join(bw.get(c,c) for c in s)
def key(s):
    s = s.replace('ٰ','ا').replace('ٱ','ا').replace('أ','ا').replace('إ','ا').replace('آ','ا').replace('ى','ي')
    return ''.join(c for c in s if '\u0621' <= c <= '\u064a' and c != 'ـ')
words = collections.defaultdict(list)
for line in source.read_text().splitlines():
    if not line.startswith('('): continue
    loc, text, tag, features = line.split('\t')
    surah, ayah, word, segment = map(int, loc.strip('()').split(':'))
    parts = features.split('|')
    converted = [p.split(':',1)[0]+':'+arabic(p.split(':',1)[1]) if p.startswith(('LEM:','ROOT:')) else p for p in parts]
    words[surah,ayah,word].append([arabic(text),tag,converted])
word_counts = collections.Counter()
for s,a,w in words: word_counts[s,a] = max(word_counts[s,a],w)
quran = json.loads((root/'src/data/uthmani.json').read_text())
matched = total = 0
for surah in range(1,115):
    result=[]
    for row in quran[str(surah)]:
        text=row['text']
        if row['verse']==1 and surah not in (1,9): text=' '.join(text.split()[4:])
        visible=text.split(); corpus=[words[surah,row['verse'],w] for w in range(1,1+word_counts[surah,row['verse']])]
        # Retain display indexes, including standalone ornaments; never guess shifted mappings.
        indexes=[i for i,w in enumerate(visible) if key(w)]
        out=[None]*len(visible)
        if len(indexes)==len(corpus):
            for i,segments in zip(indexes,corpus):
                total+=1
                if key(visible[i])==key(''.join(s[0] for s in segments)):
                    out[i]=segments; matched+=1
        else: total+=len(indexes)
        result.append(out)
    (root/f'public/data/grammar/{surah}.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
(root/'public/data/grammar/provenance.json').write_text(json.dumps({'source':'Quranic Arabic Corpus v0.4','mirror':'cltk/arabic_morphology_quranic-corpus','commit':'b5abd4d8fadd775f3329f34cbe10531fac71e391','sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'matchedWords':matched,'totalDisplayWords':total,'mapping':'Same word count and normalized spelling required; unmatched words have no annotation.'},indent=2))
print(f'Matched {matched}/{total} displayed words; unmatched annotations withheld.')
