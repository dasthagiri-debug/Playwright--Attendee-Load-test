const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const REG_URL = process.env.REG_URL || 'https://easywebinarsupport.easywebinar.live/event-registration-670';
const COUNT = parseInt(process.env.CAP_COUNT || '5', 10);
const LOG_DIR = path.join(__dirname, 'logs');
fs.mkdirSync(LOG_DIR, { recursive: true });
const OUT = path.join(LOG_DIR, 'network_log.json');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const records = [];

  page.on('request', req => {
    const r = { id: req._requestId || Math.random().toString(36).slice(2), url: req.url(), method: req.method(), resourceType: req.resourceType(), headers: req.headers(), postData: req.postData(), time: new Date().toISOString(), type: 'request' };
    records.push(r);
  });

  page.on('response', async res => {
    try {
      const req = res.request();
      const body = await res.text().catch(() => '[binary]');
      records.push({ id: req._requestId || Math.random().toString(36).slice(2), url: res.url(), status: res.status(), statusText: res.statusText(), headers: res.headers(), body: body.slice(0, 20000), time: new Date().toISOString(), type: 'response' });
    } catch (e) {}
  });

  const emailSelectors = ['input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]', 'input[placeholder*="Email" i]'];
  const firstNameSelectors = ['input[name*="first" i]', 'input[id*="first" i]', 'input[placeholder*="First" i]'];
  const lastNameSelectors = ['input[name*="last" i]', 'input[id*="last" i]', 'input[placeholder*="Last" i]'];
  const submitSelectors = ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Register")', 'button:has-text("Register Now")'];

  async function tryFill(selectors, value) {
    for (const sel of selectors) {
      const loc = page.locator(sel);
      if (await loc.count() > 0) {
        await loc.first().fill(value).catch(() => {});
        return true;
      }
    }
    return false;
  }

  for (let i = 1; i <= COUNT; i++) {
    const email = `dasthagiri+cap${i}@gmail.com`;
    await page.goto(REG_URL, { waitUntil: 'domcontentloaded' });
    await tryFill(firstNameSelectors, `Cap${i}`);
    await tryFill(lastNameSelectors, 'Tester');
    await tryFill(emailSelectors, email);

    // click submit
    let clicked = false;
    for (const sel of submitSelectors) {
      const loc = page.locator(sel);
      if (await loc.count() > 0) {
        await Promise.all([page.waitForResponse(r => r.url().includes('/api') || r.request().resourceType() === 'xhr' || r.request().resourceType() === 'fetch', {timeout: 5000}).catch(() => {}), loc.first().click().catch(() => {})]);
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      try { await page.locator('button').first().click(); } catch(e){}
    }

    await page.waitForTimeout(1500);
  }

  fs.writeFileSync(OUT, JSON.stringify(records, null, 2));
  console.log('Saved network log to', OUT);
  await browser.close();
})();
