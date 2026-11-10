import {spawn} from 'node:child_process';
import {readFile,mkdir,writeFile,copyFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright';
const root='http://127.0.0.1:4184/';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4184','--strictPort','--base=/','--outDir','native-dist'],{stdio:'ignore'});
let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch(root)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 await mkdir('play-store/graphics/phone-screenshots',{recursive:true});
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:360,height:640},deviceScaleFactor:3,hasTouch:true});
 await page.goto(root);await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:'play-store/graphics/phone-screenshots/01-read-quran.png'});
 await page.locator('#surah-picker').selectOption('4');
 const created=await page.locator('[data-study-word]').evaluateAll(nodes=>nodes.find(e=>e.textContent.replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g,'')==='خلقكم')?.dataset.studyWord);
 await page.waitForFunction(ref=>document.querySelector(`[data-study-word="${ref}"]`)?.getAttribute('role')==='button',created);
 await page.locator(`[data-study-word="${created}"]`).tap();
 await page.waitForFunction(()=>document.querySelector('.study-meaning-value')?.textContent==='created you');
 await page.screenshot({path:'play-store/graphics/phone-screenshots/02-word-meaning-grammar.png'});
 await page.keyboard.press('Escape');await page.locator('#controls-toggle').click();await page.locator('#open-challenge').click();
 await page.locator('#quiz-surah').selectOption('112');await page.locator('#challenge-begin').click();
 await page.screenshot({path:'play-store/graphics/phone-screenshots/03-memorize.png'});
 await page.locator('#theme').click();
 await page.screenshot({path:'play-store/graphics/phone-screenshots/04-dark-reader.png'});
 await page.close();
 const graphic=await browser.newPage({viewport:{width:1024,height:500}});
 const icon=await readFile('public/icons/hifdh.svg','utf8');
 await graphic.setContent(`<style>html,body{margin:0;width:100%;height:100%;font-family:Arial,sans-serif;background:#102e29;color:#fff}.frame{height:100%;display:flex;align-items:center;gap:70px;padding:0 85px;box-sizing:border-box}img{width:220px;border-radius:36px}h1{font-size:86px;margin:0 0 12px;letter-spacing:-3px}p{font-size:30px;line-height:1.5;margin:0;color:#cce6dd}</style><div class="frame"><img src="data:image/svg+xml;base64,${Buffer.from(icon).toString('base64')}" alt=""><div><h1>Hifdh</h1><p>Read. Memorize. Study.<br>Your Quran companion.</p></div></div>`);
 await graphic.screenshot({path:'play-store/graphics/feature-graphic.png'});
 await copyFile('public/icons/hifdh-512.png','play-store/graphics/icon-512.png');
 await writeFile('play-store/graphics/CAPTURE-NOTES.txt','Phone screenshots: 1080×1920, generated from the actual bundled app UI in Chromium at 360×640 CSS pixels, DPR 3. No speech recording or fake progress was used. These are not real Android-device captures; confirm presentation on a target Android device before uploading. Feature graphic: original Hifdh artwork, 1024×500. App icon: 512×512.\n');
 console.log('Generated four phone screenshots, a 1024×500 feature graphic and a 512px app icon.');
}finally{await browser?.close();server.kill();}
