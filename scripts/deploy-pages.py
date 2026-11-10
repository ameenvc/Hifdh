"""Publish the built site, retaining native downloads across web-only updates."""
import argparse, hashlib, pathlib, shutil, subprocess, tempfile
parser=argparse.ArgumentParser()
parser.add_argument('--apk',default='artifacts/Hifdh-preview.apk')
args=parser.parse_args()
source=pathlib.Path('dist')
if not (source/'index.html').exists():raise SystemExit('Build the web site before deploying.')
target=pathlib.Path(tempfile.mkdtemp(prefix='hifdh-pages-',dir='/tmp'))
def git(*args):subprocess.run(['git','-C',str(target),*args],check=True)
subprocess.run(['git','clone','--single-branch','--branch','gh-pages','https://github.com/ameenvc/Hifdh.git',str(target)],check=True)
for item in target.iterdir():
 if item.name not in ('.git','downloads'):
  if item.is_dir():shutil.rmtree(item)
  else:item.unlink()
shutil.copytree(source,target,dirs_exist_ok=True)
(target/'.nojekyll').touch()
apk=pathlib.Path(args.apk)
if apk.exists():
 downloads=target/'downloads';downloads.mkdir(exist_ok=True)
 shutil.copyfile(apk,downloads/'Hifdh-preview.apk')
 digest=hashlib.sha256(apk.read_bytes()).hexdigest()
 (downloads/'Hifdh-preview.apk.sha256').write_text(digest+'  Hifdh-preview.apk\n')
 (downloads/'index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Install Hifdh</title><style>body{font:17px/1.6 system-ui;background:#f3f7f6;color:#153b35;margin:0;padding:32px 20px}main{max-width:560px;margin:32px auto;background:white;border:1px solid #dbe7e3;border-radius:20px;padding:28px}a.button{display:block;background:#147f79;color:white;text-decoration:none;border-radius:12px;text-align:center;padding:15px;margin:20px 0}a{color:#147f79}small{color:#526861}code{font-size:12px;overflow-wrap:anywhere}</style><main><h1>Hifdh on your phone</h1><h2>Android preview</h2><p>Install the test app directly on an Android phone. The Quran and study data are bundled; speech recognition and reciter audio may need internet.</p><a class="button" href="Hifdh-preview.apk" download>Download Android APK</a><p>Open the downloaded file and allow installation from your browser if Android asks. This is a preview build, not a Google Play release. Future preview builds signed on another machine may require uninstalling the old preview first.</p><small>Real-device microphone behaviour is still being tested. Recitation text matching is not validated Quran mistake detection.</small><h2>iPhone</h2><p>Open <a href="../">Hifdh in Safari</a>, tap Share, then Add to Home Screen. This adds the website as a home-screen app. It is not an App Store app and still needs connectivity.</p><p><a href="../">Open Hifdh</a> · <a href="Hifdh-preview.apk.sha256">APK checksum</a></p><small>Android APK SHA-256:</small><br><code>'''+digest+'''</code></main></html>''')
git('add','-A')
if subprocess.run(['git','-C',str(target),'diff','--cached','--quiet']).returncode==0:print('No deployment changes.')
else:
 git('commit','-m','Deploy Hifdh web app and native preview downloads')
 git('push','origin','gh-pages')
print('Published: https://ameenvc.github.io/Hifdh/ — downloads: /Hifdh/downloads/')
