import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
for(const variable of ['HIFDH_UPLOAD_STORE_FILE','HIFDH_UPLOAD_PASSWORD_FILE']){
 if(!process.env[variable]||!existsSync(process.env[variable]))throw Error(`${variable} must point to a private local file. Never use the debug key for a Play upload.`);
}
const windows=process.platform==='win32';
const processBuild=spawn(windows?'gradlew.bat':'./gradlew',['bundleRelease','--no-daemon'],{cwd:'android',stdio:'inherit',shell:windows});
const code=await new Promise((resolve,reject)=>{processBuild.once('error',reject);processBuild.once('exit',resolve);});
if(code!==0)process.exit(code||1);
await mkdir('artifacts/play-store',{recursive:true});
const output='artifacts/play-store/Hifdh-release.aab';
await copyFile('android/app/build/outputs/bundle/release/app-release.aab',output);
await writeFile(output+'.sha256',createHash('sha256').update(await readFile(output)).digest('hex')+'  Hifdh-release.aab\n');
console.log(`Signed Play release candidate: ${output}. This does not submit or approve a Play Store release.`);
