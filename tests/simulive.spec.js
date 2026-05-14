import { test, expect } from '@playwright/test';

test('Create Simulive Webinar', async ({ page }) => {
  // 1. Start at the dashboard
  await page.goto('https://uat.easywebinar.com/dashboard');

  // 2. Your recorded actions
  await page.getByRole('button', { name: 'Create a Webinar' }).click();
  await page.getByText('Simulive WebinarPre-recorded').click();
  await page.getByRole('textbox', { name: 'e.g., Master Email Marketing' }).click();
  await page.getByRole('textbox', { name: 'e.g., Master Email Marketing' }).fill('Simul automate');
  await page.getByRole('button', { name: 'Next : Scheduling Options' }).click();
  
  // Timezone is now auto-selected by default
  await expect(page.getByLabel('Webinar Timezone')).toContainText('(UTC+05:30)-Chennai, Kolkata, Mumbai, New Delhi');
  
  await page.getByRole('button', { name: 'Next : Video Selection' }).click();
  
  // Note: Using 'first()' or 'path' can be flaky; 
  // if this fails, we might need a better locator here.
  await page.locator('.ew-hover-element > path').first().click();
  
  await page.getByRole('button', { name: 'Continue to Templates' }).click();
  await Promise.all([
    page.waitForURL(/\/v2\/events\/\d+\/schedule(?:\?.*)?$/),
    page.getByRole('button', { name: 'Skip & Next: Dashboard' }).click(),
  ]);

  // 3. Final Assertions: confirm redirect to created webinar overview page
  await expect(page.getByRole('heading', { name: 'Webinar Overview', level: 4 })).toBeVisible();
});
