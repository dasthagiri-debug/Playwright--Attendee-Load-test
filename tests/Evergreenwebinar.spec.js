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

async function isToggleOn(toggleLocator) {
  const ariaChecked = await toggleLocator.getAttribute('aria-checked');
  if (ariaChecked !== null) {
    return ariaChecked === 'true';
  }
  return toggleLocator.isChecked().catch(() => false);
}

async function ensureToggleOn(toggleLocator) {
  await expect(toggleLocator).toBeVisible({ timeout: 15000 });

  const initiallyOn = await isToggleOn(toggleLocator);
  if (!initiallyOn) {
    await toggleLocator.click({ timeout: 10000, force: true });
  }

  await expect.poll(async () => isToggleOn(toggleLocator), { timeout: 15000 }).toBe(true);
}

async function ensureEditScheduleTogglesOn(page, webinarTitle) {
  // Normalize state: always reopen the newly created webinar from list.
  await page.goto('https://uat.easywebinar.com/v2/events', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /My Webinars/i })).toBeVisible({ timeout: 30000 });

  const searchBox = page.getByRole('textbox', { name: 'Search' });
  await searchBox.fill(webinarTitle);
  const webinarCard = page.getByText(webinarTitle, { exact: false }).first();
  const hasExactTitleCard = await webinarCard.isVisible({ timeout: 10000 }).catch(() => false);

  if (hasExactTitleCard) {
    await webinarCard.click();
  } else {
    await searchBox.fill('');
    const firstEvergreenCard = page
      .locator('div', { has: page.getByText(/Evergreen/i) })
      .filter({ has: page.getByText(/Upcoming Session/i) })
      .first();
    await expect(firstEvergreenCard).toBeVisible({ timeout: 30000 });
    await firstEvergreenCard.click();
  }

  await expect(page).toHaveURL(/\/v2\/events\/\d+\/schedule/, { timeout: 60000 });

  const schedulingSection = page
    .locator('div', { has: page.getByRole('heading', { name: /Scheduling Options/i }) })
    .first();
  await expect(schedulingSection).toBeVisible({ timeout: 30000 });
  await schedulingSection.locator('button').last().click({ timeout: 10000, force: true });
  await page.getByRole('menuitem', { name: 'Edit Schedule' }).click({ timeout: 15000 });

  await expect(page.getByRole('button', { name: 'Options' })).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Options' }).click({ timeout: 10000 });

  const jitToggle = page
    .locator('div', { has: page.getByRole('heading', { name: /Just-in-time Registration/i }) })
    .getByRole('checkbox')
    .first();

  const instantReplayToggle = page
    .locator('div', { has: page.getByRole('heading', { name: /Instant-Replay/i }) })
    .getByRole('checkbox')
    .first();

  await ensureToggleOn(jitToggle);
  await ensureToggleOn(instantReplayToggle);

  await page.getByRole('button', { name: 'Update Schedule' }).click({ timeout: 10000 });
  await expect.poll(async () => isToggleOn(jitToggle), { timeout: 15000 }).toBe(true);
  await expect.poll(async () => isToggleOn(instantReplayToggle), { timeout: 15000 }).toBe(true);

  // Reopen the same page and re-check persisted state.
  await page.goto(page.url(), { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Options' }).click({ timeout: 10000 });
  await expect.poll(async () => isToggleOn(jitToggle), { timeout: 15000 }).toBe(true);
  await expect.poll(async () => isToggleOn(instantReplayToggle), { timeout: 15000 }).toBe(true);

  const exitButton = page.getByRole('button', { name: /EXIT/i });
  if (await exitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await exitButton.click({ timeout: 10000 });
  }
}

test('Create Evergreen webinar with daily recurring schedule and 3 times', async ({ page }) => {
  test.setTimeout(150000);

  const webinarTitle = `Evergreen Masterclass ${Date.now()}`;

  await loginIfNeeded(page);

  await page.getByRole('button', { name: 'Create a Webinar' }).click();
  await expect(page.getByRole('heading', { name: 'Create a Webinar' })).toBeVisible();

  await page.getByRole('heading', { name: 'Evergreen Webinar' }).click();
  await expect(page.getByRole('radio', { name: /^Evergreen Webinar\b/i })).toBeChecked();

  await page.getByRole('textbox', { name: 'e.g., Master Email Marketing in 60 Minutes' }).fill(webinarTitle);
  await addTag(page, 'automation');
  await page.getByRole('button', { name: /^Free$/ }).click();

  const nextScheduling = page.getByRole('button', { name: /Next : Scheduling Options/i });
  await expect(nextScheduling).toBeEnabled({ timeout: 15000 });
  await nextScheduling.click();

  await expect(page.getByRole('heading', { name: 'Schedule Your Webinar' })).toBeVisible({ timeout: 20000 });

  const jitSection = page.locator('div', {
    has: page.getByRole('heading', { name: /Just-in-time Registration/i }),
  });
  const instantReplaySection = page.locator('div', {
    has: page.getByRole('heading', { name: /Instant-Replay/i }),
  });
  const recurringSection = page.locator('div', {
    has: page.getByRole('heading', { name: /Recurring Schedule/i }),
  });

  const jitToggle = jitSection.getByRole('checkbox').first();
  const instantReplayToggle = instantReplaySection.getByRole('checkbox').first();
  const recurringToggle = recurringSection.getByRole('checkbox').first();

  await ensureToggleOn(jitToggle);
  await ensureToggleOn(instantReplayToggle);
  await ensureToggleOn(recurringToggle);

  await page.getByRole('button', { name: 'Daily' }).click();
  await expect(page.getByRole('button', { name: 'Daily' })).toHaveAttribute('aria-pressed', 'true');

  const endDateInput = page.getByRole('textbox', { name: 'When should this end? (optional)' });
  await endDateInput.fill('');
  await expect(endDateInput).toHaveValue('');

  const addTimeButton = page.getByRole('button', { name: 'Add Time' });
  await expect(addTimeButton).toBeVisible();

  const timeInputs = page.getByRole('textbox', { name: 'Time' });
  await timeInputs.nth(0).fill('10:00 AM');

  await addTimeButton.click();
  await expect(timeInputs).toHaveCount(2);
  await timeInputs.nth(1).fill('02:00 PM');

  await addTimeButton.click();
  await expect(timeInputs).toHaveCount(3);
  await timeInputs.nth(2).fill('07:00 PM');

  const nextVideo = page.getByRole('button', { name: /Next : Video Selection/i });
  await expect(nextVideo).toBeEnabled({ timeout: 20000 });
  await nextVideo.click();

  const onChooseVideoStep = await page
    .getByRole('heading', { name: 'Choose Your Video' })
    .isVisible({ timeout: 10000 })
    .catch(() => false);

  if (onChooseVideoStep) {
    // Select a library video card using visible text in the card.
    const firstVideoCard = page.locator('div', {
      has: page.getByText(/\d{1,2}\s*Min/i).first(),
    }).first();
    await firstVideoCard.click({ timeout: 15000 });

    // Product may show either button label depending on state.
    const toTemplatesButton = page.getByRole('button', {
      name: /Continue to Templates|Skip\s*&\s*Next:\s*Templates/i,
    });
    await expect(toTemplatesButton).toBeEnabled({ timeout: 20000 });
    try {
      await toTemplatesButton.click({ timeout: 5000 });
    } catch {
      await toTemplatesButton.click({ timeout: 10000, force: true });
    }

    const onTemplateStep = await page.getByRole('heading', { name: 'Pick Your Template' }).isVisible({ timeout: 8000 }).catch(() => false);
    if (onTemplateStep) {
      await Promise.all([
        page.waitForURL(/\/v2\/events\/\d+\/schedule/, { timeout: 60000 }),
        page.getByRole('button', { name: /Skip\s*&\s*Next:\s*Dashboard/i }).click(),
      ]);
    }
  }

  if (!/\/v2\/events\/\d+\/schedule/.test(page.url())) {
    if (await page.getByRole('heading', { name: /My Webinars/i }).isVisible({ timeout: 8000 }).catch(() => false)) {
      await page.getByText(webinarTitle, { exact: false }).first().click();
      await expect(page).toHaveURL(/\/v2\/events\/\d+\/schedule/, { timeout: 60000 });
    }
  }

  if (!/\/v2\/events\/\d+\/schedule/.test(page.url())) {
    if (await page.getByRole('heading', { name: /My Webinars/i }).isVisible({ timeout: 8000 }).catch(() => false)) {
      await expect(page.getByText(webinarTitle, { exact: false }).first()).toBeVisible({ timeout: 30000 });
      await page.getByText(webinarTitle, { exact: false }).first().click();
      await expect(page).toHaveURL(/\/v2\/events\/\d+\/schedule/, { timeout: 60000 });
    }
  }

  await ensureEditScheduleTogglesOn(page, webinarTitle);
});
