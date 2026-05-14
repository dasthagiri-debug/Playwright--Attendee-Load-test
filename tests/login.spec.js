import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://accounts-uat.easywebinar.com/login');
  await page.getByRole('textbox', { name: 'Email address/Username' }).click();
  await page.getByRole('textbox', { name: 'Email address/Username' }).fill('dasthagiri+uat2@easywebinar.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('Welcome@123');
  await page.getByRole('button', { name: 'Log In' }).click();
await expect(page.getByText('Live Events')).toBeVisible({timeout:20000});a
  
});
