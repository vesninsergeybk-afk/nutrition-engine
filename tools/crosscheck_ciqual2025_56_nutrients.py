#!/usr/bin/env python3
"""Audit missing values against official ANSES Ciqual 2025 French table.

Uses food identity in native French, bilingual keyword translation and
existing macro fingerprints, preserving all food states. Reports measured or
published numbers with row ID only, never auto-fills clinical food catalog.
"""
import argparse,io,json,hashlib,re,unicodedata,math,requests
from pathlib import Path
from collections import Counter
from openpyxl import load_workbook

FR={
"oil":"huile","flour":"farine","cheese":"fromage","milk":"lait","spice":"epice",
"allspice":"quatre epices","bay":"laurier","leaf":"feuille","rosemary":"romarin",
"tarragon":"estragon","fennel":"fenouil","anise":"anis","fenugreek":"fenugrec",
"mace":"macis","nutmeg":"muscade","saffron":"safran","savory":"sarriette",
"marjoram":"marjolaine","sage":"sauge","caraway":"carvi","celery":"celeri",
"white":"blanc","pepper":"poivre","chervil":"cerfeuil","seed":"graine",
"buckwheat":"sarrasin","chickpea":"pois chiche","oat":"avoine","barley":"orge",
"spelt":"epeautre","millet":"millet","peanut":"arachide","soy":"soja",
"arrowroot":"arrow root","apricot":"abricot","kernel":"noyau","rice":"riz",
"bran":"son","mustard":"moutarde","almond":"amande","hazelnut":"noisette",
"avocado":"avocat","sheep":"brebis","goat":"chevre","fresh":"frais",
"dried":"sec","ground":"moulu","creamed":"creme","desiccated":"seche",
"coconut":"coco","pinto":"pinto","pea":"pois","bean":"haricot",
"pigeon":"pigeon","seeds":"graines","salmon":"saumon","snapper":"vivaneau",
"catfish":"silure","wolffish":"loup","zander":"sandre",
"fish":"poisson","lobster":"homard","mackerel":"maquereau",
"swordfish":"espadon","tuna":"thon","pike":"brochet",
"cocoa":"cacao","butter":"beurre","sunflower":"tournesol","sesame":"sesame"
}
STOP={"spice","with","whole","type","raw","fat","food","dried","fresh",
      "ground","low","seeds","seed","mature","fluid","in","the"}
def norm(t):
 t=unicodedata.normalize("NFKD",str(t or "").lower())
 t="".join(c for c in t if not unicodedata.combining(c))
 return " ".join(re.sub(r"[^a-z0-9]+"," ",t).split())
def translate(t):
 words=norm(t).split()
 out=[]
 for w in words:
  if w in STOP:continue
  out+=norm(FR.get(w,w)).split()
 return " ".join(out)
def sim(a,b):
 a=set(norm(a).split());b=set(norm(b).split())
 return len(a&b)/len(a|b) if a|b else 0
def number(v):
 if isinstance(v,(float,int)) and math.isfinite(v) and v>=0:return float(v)
 if not isinstance(v,str):return None
 v=v.strip()
 if v.startswith(("<",">","~","-")):return None
 try:
  ans=float(v.replace(",","."))
  return ans if math.isfinite(ans) and ans>=0 else None
 except ValueError:return None
def load_source():
 url="https://entrepot.recherche.data.gouv.fr/api/access/datafile/666260"
 r=requests.get(url,timeout=70,headers={"Accept":"*/*"});r.raise_for_status()
 assert hashlib.md5(r.content).hexdigest()=="0d9758ce23f3f13dd63a005bc1bb4f2c"
 book=load_workbook(io.BytesIO(r.content),read_only=True,data_only=True)
 ws=book["composition nutritionnelle"]
 rows=ws.iter_rows(values_only=True)
 header=list(next(rows))
 content=[dict(zip(header,r)) for r in rows if r[6]]
 assert len(content)>=3400,len(content)
 return header,content
def main():
 p=argparse.ArgumentParser()
 for k in ("blocked","out"):p.add_argument("--"+k,required=True)
 a=p.parse_args()
 target=json.loads(Path(a.blocked).read_text())
 header,foods=load_source()
 labels={field:[h for h in header if re.search(regex,norm(h))] for field,regex in {
 "choline_mg":r"choline",
 "vitamin_e_mg":r"vitamine e",
 "vitamin_k_mcg":r"vitamine k1",
 "vitamin_c_mg":r"vitamine c",
 "vitamin_b5_mg":r"vitamine b5",
 "vitamin_b9_mcg":r"vitamine b9",
 "vitamin_b12_mcg":r"vitamine b12",
 "selenium_ug":r"selenium",
 "manganese_mg":r"manganese",
 "copper_mg":r"cuivre",
 "sugar_per_100g":r"^sucres",
 "vitamin_d_mcg":r"vitamine d",
 "vitamin_a_mcg":r"vitamine a",
 "vitamin_b2_mg":r"vitamine b2",
 "sfa":r"acides gras satures",
 }.items()}
 print("CIQUAL2025_FULL_COLUMNS",json.dumps(header,ensure_ascii=False)[:16000])
 print("CIQUAL2025_NUTRIENT_MAP",json.dumps(labels,ensure_ascii=False)[:9000])
 macro_names={
 "protein_per_100g":next((h for h in header if norm(h).startswith("proteines")),None),
 "fat_per_100g":next((h for h in header if norm(h).startswith("lipides")),None)
 }
 assert all(macro_names.values()),macro_names
 result=[];observations=[]
 for t in target:
  ident=t["family_key"]
  english=t["primary_source"]["source_name"]
  query=translate(ident)
  # Two alternative phrases: family key (short) and official US/Canada name
  qsrc=translate(english)
  scores=sorted(((max(sim(query,f["alim_nom_fr"]),sim(qsrc,f["alim_nom_fr"])),f) for f in foods),key=lambda x:x[0],reverse=True)[:6]
  top=[]
  for rank,(score,f) in enumerate(scores):
   name=f["alim_nom_fr"]
   direct=norm(name)==norm(query) or norm(name)==norm(qsrc)
   macro=[]
   for col,header_name in macro_names.items():
    old=t["nutrients"].get(col);val=number(f[header_name])
    macro.append({"field":col,"reference":old,"donor":val,
      "parity":old is not None and val is not None and abs(old-val)<=max(.4,.20*old)})
   parity=all(z["parity"] for z in macro)
   # French name can specify more processing descriptors. Only human verified.
   donor={"ciqual_id":f["alim_code"],"french_name":name,"translated_query":query,
       "source_english":english,"similarity":round(score,3),
       "name_exact":direct,"macro":macro,"macro_parity":parity,"possible_gaps":[]}
   for field,v in t["nutrients"].items():
    if v is not None:continue
    col=labels.get(field,[])
    if len(col)!=1:continue
    n=number(f[col[0]])
    if n is None:continue
    obs={"family_key":ident,"field":field,"value":n,"source_food_id":f["alim_code"],
       "food_name_fr":name,"column":col[0],"macro_parity":parity,
       "semantic_similarity":round(score,3),
       "status":"HUMAN_IDENTITY_AND_SOURCE_METHOD_REVIEW_REQUIRED"}
    donor["possible_gaps"].append(obs)
    if parity and score>=.55:observations.append(obs)
   if score>=.24 or rank==0:top.append(donor)
  result.append({"family":ident,"source_name":english,"query_fr":query,"matches":top})
  if top:print("CIQUAL2025_FOOD_CANDIDATES",json.dumps({"family":ident,"fr":query,
      "best":[{"id":v["ciqual_id"],"name":v["french_name"],"sim":v["similarity"],"parity":v["macro_parity"],"candidate_fields":len(v["possible_gaps"])} for v in top[:3]]},ensure_ascii=False))
 summary={
 "source":"ANSES Ciqual2025 Nov2025 DOI:10.57745/RDMHWY",
 "source_file_id":666260,"source_file_md5":"0d9758ce23f3f13dd63a005bc1bb4f2c",
 "records":len(foods),"blocked":len(target),
 "potential_values_good_macros_approx_bilingual":len(observations),
 "field_counts":dict(Counter(x["field"] for x in observations)),
 "observations_awaiting_manual":observations,"foods":result,
 "changes_to_runtime":0,"changes_to_staging":0}
 out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
 (out/"ciqual2025_56_bilingual_candidates.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
 print("CIQUAL2025_RECOVERY_SUMMARY",json.dumps({k:v for k,v in summary.items() if k not in ("observations_awaiting_manual","foods")},ensure_ascii=False))
 for x in observations:print("CIQUAL2025_POTENTIAL",json.dumps(x,ensure_ascii=False))
if __name__=="__main__":main()
