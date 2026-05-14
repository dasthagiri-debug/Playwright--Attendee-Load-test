const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function run() {
  const baseUrl = 'https://accounts-test.easywebinar.com/login';
  const scenarios = [
    { name: 'blank_email_blank_password', email: '', password: '' },
    { name: 'blank_password', email: 'dasthagiri+co1@easywebinar.com', password: '' },
    { name: 'blank_email', email: '', password: 'Welcome@123' },
    { name: 'malformed_email', email: 'abc', password: 'Welcome@123' },
    { name: 'email_with_spaces', email: '  dasthagiri+co2@easywebinar.com  ', password: 'Welcome@123' },
    { name: 'wrong_password', email: 'dasthagiri+co3@easywebinar.com', password: 'WrongPass123!' },
    { name: 'uppercase_email', email: 'DASHTAGIRI+CO4@EASYWEBINAR.COM', password: 'WrongPass123!' },
    { name: 'password_spaces_only', email: 'dasthagiri+co5@easywebinar.com', password: '      ' },
    { name: 'password_only_symbols', email: 'dasthagiri+co6@easywebinar.com', password: '!!!!@@@@####' },
    { name: 'password_unicode', email: 'dasthagiri+co7@easywebinar.com', password: 'Pässwörd123!' },
    { name: 'long_password', email: 'dasthagiri+co8@easywebinar.com', password: 'A'.repeat(128) + '1!' },
    { name: 'trailing_spaces_password', email: 'dasthagiri+co9@easywebinar.com', password: 'WrongPass123!   ' },
    { name: 'email_plus_alias', email: 'dasthagiri+qa10@easywebinar.com', password: 'WrongPass123!' },
  ];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.setDefaultTimeout(30000);

  const results = [];

  for (const scenario of scenarios) {
    const apiResponses = [];
    const consoleErrors = [];

    const onResponse = async (res) => {
      const url = res.url();
      if (/login|auth|session|token|verify|user/i.test(url)) {
        let body = '';
        try {
          const ct = res.headers()['content-type'] || '';
          if (ct.includes('application/json')) {
            body = JSON.stringify(await res.json()).slice(0, 500);
          } else {
            body = (await res.text()).slice(0, 300);
          }
        } catch {
          body = '';
        }
        apiResponses.push({ url, status: res.status(), body });
      }
    };

    const onConsole = (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    };

    page.on('response', onResponse);
    page.on('console', onConsole);

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

    const emailBox = page.getByRole('textbox', { name: 'Email address/Username' });
    const passwordBox = page.getByRole('textbox', { name: 'Password' });
    const loginButton = page.getByRole('button', { name: 'Log In' });

    if (scenario.email !== '') {
      await emailBox.fill(scenario.email);
    }
    if (scenario.password !== '') {
      await passwordBox.fill(scenario.password);
    }

    await loginButton.click();
    await page.waitForTimeout(3500);

    const urlAfter = page.url();
    const bodyText = await page.locator('body').innerText();
    const visibleMessages = [...new Set(
      bodyText
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => /error|invalid|password|email|username|required|failed|try again|incorrect|wrong|locked|account/i.test(line))
    )].slice(0, 12);

    const loginApi = apiResponses.find((item) => /login|auth|session|token|verify/i.test(item.url));

    results.push({
      scenario: scenario.name,
      email: scenario.email,
      password: scenario.password,
      urlAfter,
      visibleMessages,
      loginApiStatus: loginApi ? loginApi.status : null,
      loginApiUrl: loginApi ? loginApi.url : null,
      loginApiBody: loginApi ? loginApi.body : null,
      consoleErrors: [...new Set(consoleErrors)].slice(0, 5),
    });

    page.off('response', onResponse);
    page.off('console', onConsole);
  }

  const summary = {
    total: results.length,
    apiCallsObserved: results.filter((r) => r.loginApiStatus !== null).length,
    clientValidationOnly: results.filter((r) => r.loginApiStatus === null && r.visibleMessages.length > 0).length,
  };

  const outPath = path.resolve(__dirname, '..', 'test-results', 'site-audit', 'Login-Negative-Matrix-TestServer.json');
  fs.writeFileSync(outPath, JSON.stringify({ summary, results }, null, 2), 'utf8');
  console.log(`Results written to ${outPath}`);
  console.log(JSON.stringify(summary, null, 2));

  await browser.close();
}

run().catch((error) => {
  console.error('Run failed:', error);
  process.exit(1);
});
