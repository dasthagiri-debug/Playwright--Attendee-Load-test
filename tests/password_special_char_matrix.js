const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function run() {
  const baseUrl = 'https://accounts-uat.easywebinar.com/signup?planId=All-In-One-USD-Yearly-200';
  const specials = [
    '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+',
    '[', ']', '{', '}', '\\', '|', ';', ':', "'", '"', ',', '.', '<', '>', '/', '?', '`', '~'
  ];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.setDefaultTimeout(30000);

  let emailCounter = 1;
  const results = [];

  async function runOneScenario(ch) {
    let attempts = 0;

    while (attempts < 20) {
      attempts += 1;
      const email = `dasthagiri+co${emailCounter}@easywebinar.com`;
      emailCounter += 1;

      const api = [];
      const onResponse = async (res) => {
        const u = res.url();
        if (/check-email-exists|generate-subdomain|signup|register|auth/i.test(u)) {
          let body = '';
          try {
            body = (await res.text()).slice(0, 300);
          } catch {
            body = '';
          }
          api.push({ url: u, status: res.status(), body });
        }
      };

      page.on('response', onResponse);

      try {
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Continue with Email' }).click();

        await page.getByPlaceholder('John Doe').fill('Dasthagiri QA');
        await page.getByPlaceholder('john@company.com').fill(email);
        await page.getByPlaceholder('Create a strong password').fill(`Abcd123${ch}`);

        await page.getByRole('button', { name: 'Continue' }).click();
        await page.waitForTimeout(3000);

        const urlAfter = page.url();
        const bodyText = await page.locator('body').innerText();

        const emailExists = /Email already in use|Try logging in/i.test(bodyText);
        const passwordErrMatch = bodyText.match(/Password must[^\n]*/i);
        const passwordErr = passwordErrMatch ? passwordErrMatch[0] : null;

        const checkEmailResp = api.find((x) => /check-email-exists/.test(x.url));
        const signupResp = api.find((x) => /auth\/signup|auth\/register|\/signup$|\/register$/.test(x.url));

        if (emailExists) {
          page.off('response', onResponse);
          continue;
        }

        page.off('response', onResponse);

        return {
          special: ch,
          password: `Abcd123${ch}`,
          emailUsed: email,
          attempts,
          emailExists,
          passwordError: passwordErr,
          urlAfter,
          checkEmailStatus: checkEmailResp ? checkEmailResp.status : null,
          checkEmailBody: checkEmailResp ? checkEmailResp.body : null,
          signupApiStatus: signupResp ? signupResp.status : null,
          outcome: passwordErr
            ? 'password_validation_error'
            : (/\/signup/.test(urlAfter) ? 'stayed_on_signup_no_email_conflict' : 'progressed_or_redirected'),
        };
      } catch (error) {
        page.off('response', onResponse);
        return {
          special: ch,
          password: `Abcd123${ch}`,
          emailUsed: email,
          attempts,
          emailExists: false,
          passwordError: null,
          urlAfter: null,
          checkEmailStatus: null,
          checkEmailBody: null,
          signupApiStatus: null,
          outcome: 'script_error',
          scriptError: String(error.message || error),
        };
      }
    }

    return {
      special: ch,
      password: `Abcd123${ch}`,
      emailUsed: null,
      attempts,
      emailExists: true,
      passwordError: null,
      urlAfter: null,
      checkEmailStatus: null,
      checkEmailBody: null,
      signupApiStatus: null,
      outcome: 'blocked_by_email_exists_all_attempts',
    };
  }

  for (const ch of specials) {
    const result = await runOneScenario(ch);
    results.push(result);
    console.log(`[${ch}] -> ${result.outcome} | email=${result.emailUsed || 'none'} | attempts=${result.attempts}`);
  }

  const summary = {
    total: results.length,
    progressed_or_redirected: results.filter((r) => r.outcome === 'progressed_or_redirected').length,
    stayed_on_signup_no_email_conflict: results.filter((r) => r.outcome === 'stayed_on_signup_no_email_conflict').length,
    password_validation_error: results.filter((r) => r.outcome === 'password_validation_error').length,
    blocked_by_email_exists_all_attempts: results.filter((r) => r.outcome === 'blocked_by_email_exists_all_attempts').length,
    script_error: results.filter((r) => r.outcome === 'script_error').length,
  };

  const outDir = path.resolve(__dirname, '..', 'test-results', 'site-audit');
  const outPath = path.join(outDir, 'Password-Special-Character-Matrix-Results.json');
  fs.writeFileSync(outPath, JSON.stringify({ summary, results }, null, 2), 'utf8');

  console.log('\nSummary:', summary);
  console.log(`Detailed JSON: ${outPath}`);

  await browser.close();
}

run().catch((err) => {
  console.error('Run failed:', err);
  process.exit(1);
});
