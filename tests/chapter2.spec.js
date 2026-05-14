import {test, expect} from '@playwright/test';
test.use ({storageState: {cookies : [], origins: []}});
test('My Chapter 2 work with variables', async ({page }) => {
    // Variables section
    const email = 'dasthagiri+restrict1@easywebinar.com';
    const password = 'mhPeFC!n$DY7AGX7';
    const DashboardURlPart = /.*dashboard/;

    // Step 1: Go to the login page
    await page.goto('https://accounts-uat.easywebinar.com/login');
    // Step 2: Fill in the email
    await page.getByRole('textbox', { name: 'Email address/Username' }).fill(email);
    // Step 3: Fill in the password
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    // Step 4: Click Log In
    await page.getByRole('button', { name: 'Log In' }).click();
    // Step 5: THE ASSERTION
    // Verify that we successfully reached the dashboard URL
    await expect(page).toHaveURL(DashboardURlPart);
});