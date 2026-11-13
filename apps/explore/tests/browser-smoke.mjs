// Optional browser suite: provide Playwright through NODE_PATH or install it in a separate tooling directory.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const require = createRequire(import.meta.url);
const {chromium} = require('playwright');
const root = fileURLToPath(new URL('../',import.meta.url));
const server=spawn('python3',['-m','http.server','4179','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4179')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const outbound=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4179'))outbound.push(r.url())});
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}})});
 await page.goto('http://127.0.0.1:4179');
 await page.waitForFunction(()=>document.querySelector('#radiusText').textContent.includes('AU'));
 assert.equal(await page.locator('#play').getAttribute('aria-label'),'Play simulation');
 await page.locator('#tab-experiment').focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('#tab-ask').getAttribute('aria-selected'),'true');
 await page.locator('[data-question="escape"]').click();assert.match(await page.locator('#answer').textContent(),/non-negative/);
 await page.keyboard.press('Tab');
 await page.locator('#tab-ask').focus();await page.keyboard.press('End');
 assert.equal(await page.locator('#tab-learn').getAttribute('aria-selected'),'true');
 await page.locator('[data-answer="escape"]').click();assert.match(await page.locator('#masteryCount').textContent(),/1 \/ 1/);
 await page.locator('#tab-learn').focus();await page.keyboard.press('Home');
 await page.locator('[data-preset="escape"]').click();assert.equal(await page.locator('#orbitType').textContent(),'Unbound escape');
 await page.locator('[data-object="star"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#sceneFocus').textContent(),'Star selected');
 await page.locator('#graphics').click();assert.equal(await page.locator('#graphics').getAttribute('aria-pressed'),'true');
 await page.locator('#language').selectOption('hi');assert.equal(await page.locator('#headline').getAttribute('lang'),'hi');
 await page.locator('#play').click();assert.equal(await page.locator('#play').getAttribute('aria-label'),'Pause simulation');
 await page.locator('#reset').click();assert.equal(await page.locator('#time').inputValue(),'0');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);assert.deepEqual(outbound,[]);
 // Normal storage: settings persist across reload.
 const normal=await browser.newPage({reducedMotion:'reduce'});
 await normal.goto('http://127.0.0.1:4179');await normal.locator('#graphics').click();await normal.locator('#language').selectOption('hi');await normal.reload();
 assert.equal(await normal.locator('#language').inputValue(),'hi');assert.equal(await normal.locator('#graphics').getAttribute('aria-pressed'),'true');
 console.log('PASS: browser smoke (blocked storage, tabs, tutor, mastery, presets, selection, graphics, locale, playback, mobile overflow, persistence; no outbound requests).');
} finally {await browser?.close();server.kill();}
