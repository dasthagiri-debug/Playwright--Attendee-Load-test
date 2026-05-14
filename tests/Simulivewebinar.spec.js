const { test, expect } = require('@playwright/test');

const EMAIL = 'dasthagiri+usage@easywebinar.com';
const PASSWORD = 'Welcome@1';

async function loginIfNeeded(page) {
  await page.goto('https://accounts-uat.easywebinar.com/login', {
    waitUntil: 'domcontentloaded',
  });

  const emailField = page.getByRole('textbox', { name: 'Email address/Username' });
  const isLoginVisible = await emailField.isVisible({ timeout: 5000 }).catch(() => false);

  if (isLoginVisible) {
    await emailField.fill(EMAIL);
    await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
    await Promise.all([
      page.waitForURL(/\/v2\/events/, { timeout: 60000 }),
      page.getByRole('button', { name: 'Log In' }).click(),
    ]);
  }

  await expect(page).toHaveURL(/\/v2\/events/, { timeout: 60000 });
  await expect(page.getByRole('button', { name: 'Create a Webinar' })).toBeVisible({ timeout: 30000 });
}

async function addTag(page, tag) {
  const tagsInput = page.getByRole('combobox', {
    name: /e.g., marketing, email, training/i,
  });

  await tagsInput.click({ timeout: 10000 });
  await tagsInput.fill(tag, { timeout: 10000 });

  try {
    await tagsInput.press('Enter', { timeout: 5000 });
  } catch {
    await tagsInput.press('Tab', { timeout: 5000 });
  }
}

test('Create Simulive webinar with video selection', async ({ page }) => {
  test.setTimeout(120000);

  const webinarTitle = `Simulive Masterclass ${Date.now()}`;

  await loginIfNeeded(page);

  await page.getByRole('button', { name: 'Create a Webinar' }).click();
  await expect(page.getByRole('heading', { name: 'Create a Webinar' })).toBeVisible();

  await page.getByRole('heading', { name: 'Simulive Webinar' }).click();
  await expect(page.getByRole('radio', { name: /^Simulive Webinar\b/i })).toBeChecked();
  await page.getByRole('textbox', { name: 'e.g., Master Email Marketing in 60 Minutes' }).fill(webinarTitle);
  await addTag(page, 'automation');
  await page.getByRole('button', { name: /^Free$/ }).click();

  const nextScheduling = page.getByRole('button', { name: /Next : Scheduling Options/i });
  await expect(nextScheduling).toBeEnabled({ timeout: 15000 });
  await nextScheduling.click();

  const timezoneDropdown = page.getByRole('listbox', { name: 'Webinar Timezone' });
  await timezoneDropdown.click();
  await page.getByRole('option', { name: /Kolkata/i }).click();

  const nextVideo = page.getByRole('button', { name: /Next : Video Selection/i });
  await expect(nextVideo).toBeEnabled({ timeout: 20000 });
  await nextVideo.click();

  const firstVideoCard = page.locator('.event-video-column').first();
  await expect(firstVideoCard).toBeVisible({ timeout: 30000 });
  await firstVideoCard.locator('.ew-hover-element > path').first().click();

  const continueToTemplates = page.getByRole('button', { name: 'Continue to Templates' });
  await expect(continueToTemplates).toBeEnabled({ timeout: 20000 });
  await continueToTemplates.click();

  await expect(page.getByRole('heading', { name: 'Pick Your Template' })).toBeVisible({ timeout: 20000 });

  await Promise.all([
    page.waitForURL(/\/v2\/events\/\d+\/schedule/, { timeout: 60000 }),
    page.getByRole('button', { name: /Skip\s*&\s*Next:\s*Dashboard/i }).click(),
  ]);

  await expect(page.getByRole('heading', { name: /Webinar Overview/i })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('heading', { name: new RegExp(webinarTitle, 'i') })).toBeVisible({ timeout: 30000 });
});
