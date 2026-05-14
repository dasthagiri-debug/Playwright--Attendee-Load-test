import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page, context }) => {
  // --- FRESH START ---
  // This clears any existing sessions before we try to log in
  await context.clearCookies();
  
  // 1. Navigate to the login page
  await page.goto('https://accounts.easywebinar.com/login');
  
  // 2. Perform Login
  await page.getByRole('textbox', { name: 'Email address/Username' }).fill('ajay+prodtest@easywebinar.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('Welcome@1');
  await page.getByRole('button', { name: 'Log In' }).click();

  // 3. WAIT FOR UI ELEMENT
  // We wait for "Live Events" which is the dashboard heading in your screenshot
  const dashboardHeading = page.getByRole('heading', { name: 'Live Events' });
  await expect(dashboardHeading).toBeVisible({ timeout: 30000 });

  // 4. SAVE STATE
  // This saves the "Logged In" cookies to a file for all other tests to use
  await page.context().storageState({ path: authFile });
});