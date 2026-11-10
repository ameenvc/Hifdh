const key = 'hifdh-age-band-v1';
const bands = new Set(['under13','teen','adult','prefer-not']);
export function getAgeBand() { try { const band=JSON.parse(localStorage.getItem(key));return bands.has(band)?band:null; } catch{return null;} }
export function restrictedMode(band=getAgeBand()) { return band !== 'adult'; }
export function chooseAgeBand(onChosen=()=>{}) {
 document.getElementById('age-band-dialog')?.remove();
 const dialog=document.createElement('dialog');dialog.id='age-band-dialog';dialog.className='privacy-dialog';dialog.setAttribute('aria-labelledby','age-band-title');
 const title=document.createElement('h2');title.id='age-band-title';title.textContent='Choose your age range';dialog.append(title);
 const info=document.createElement('p');info.textContent='This sets privacy options. Your choice stays on this device; we do not ask for your birthday.';dialog.append(info);
 const close=()=>dialog.remove();
 for(const [value,label] of [['under13','Under 13'],['teen','13–17'],['adult','18 or older'],['prefer-not','Prefer not to answer']]){
  const button=document.createElement('button');button.className='age-band-choice';button.dataset.ageBand=value;button.textContent=label;
  button.onclick=()=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}close();onChosen(value);};dialog.append(button);
 }
 const cancel=document.createElement('button');cancel.textContent='Cancel';cancel.className='secondary-button';cancel.onclick=close;dialog.append(cancel);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});document.body.append(dialog);
 if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
}
export function privacyNotice(text) {
 document.getElementById('privacy-notice')?.remove();
 const dialog=document.createElement('dialog');dialog.id='privacy-notice';dialog.className='privacy-dialog';dialog.setAttribute('aria-label','Privacy setting');
 const p=document.createElement('p');p.textContent=text;dialog.append(p);
 const close=document.createElement('button');close.textContent='OK';close.className='secondary-button';close.onclick=()=>dialog.remove();dialog.append(close);
 dialog.addEventListener('cancel',e=>{e.preventDefault();dialog.remove();});document.body.append(dialog);
 if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
}
export async function showPrivacyPolicy(){
 const response=await fetch(`${import.meta.env.BASE_URL}privacy.html`);
 if(!response.ok){privacyNotice('Privacy policy could not load. Contact info@setilas.com.');return;}
 const parsed=new DOMParser().parseFromString(await response.text(),'text/html');
 const dialog=document.createElement('dialog');dialog.className='privacy-dialog privacy-document';dialog.setAttribute('aria-label','Hifdh privacy policy');
 const close=document.createElement('button');close.textContent='Close';close.className='secondary-button';close.onclick=()=>dialog.remove();dialog.append(close);
 for(const node of [...parsed.querySelector('main').children])dialog.append(document.importNode(node,true));
 document.body.append(dialog);dialog.addEventListener('cancel',e=>{e.preventDefault();dialog.remove();});if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
}
if(typeof document!=='undefined')document.addEventListener('click',event=>{
 const anchor=event.target.closest?.('a[href]');if(!anchor)return;
 let url;try{url=new URL(anchor.href);}catch{return;}
 const current=new URL(location.href);
 const remote=url.protocol!==current.protocol||url.host!==current.host||!['http:','https:','capacitor:'].includes(url.protocol);
 if(!remote||!restrictedMode())return;
 event.preventDefault();event.stopImmediatePropagation();
 if(!getAgeBand())chooseAgeBand(()=>{if(!restrictedMode())window.open(url.href,'_blank','noopener');else privacyNotice('External links are unavailable with these privacy settings. You can continue studying in the app.');});
 else privacyNotice('External links are unavailable with these privacy settings. Source and licence notices are bundled in the app.');
},true);
