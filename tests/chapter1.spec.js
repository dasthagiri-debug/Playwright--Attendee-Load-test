import { test, expect } from '@playwright/test';

// This line tells Playwright: "Don't use the saved login session for this test"
test.use({ storageState: { cookies: [], origins: [] } });

test('My Chapter 1 Manual Test', async ({ page }) => {
  // Step 1: Go to the login page
  await page.goto('https://accounts-uat.easywebinar.com/login');

  // Step 2: Fill in the email
  await page.getByRole('textbox', { name: 'Email address/Username' }).fill('dasthagiri+restrict1@easywebinar.com');

  // Step 3: Fill in the password
  await page.getByRole('textbox', { name: 'Password' }).fill('mhPeFC!n$DY7AGX7');

  // Step 4: Click Log In
  await page.getByRole('button', { name: 'Log In' }).click();

  // Step 5: THE ASSERTION
  // Verify that we successfully reached the dashboard URL
  await expect(page).toHaveURL(/.*dashboard/);
});