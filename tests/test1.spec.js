const { test, expect } = require('@playwright/test');

test.describe('Accounts UAT Login', () => {
	test('logs in and shows dashboard controls', async ({ page }) => {
		await page.goto('https://accounts-uat.easywebinar.com/login', {
			waitUntil: 'domcontentloaded',
		});

		const emailField = page.getByRole('textbox', { name: 'Email address/Username' });
		const loginPageVisible = await emailField.isVisible({ timeout: 5000 }).catch(() => false);

		if (loginPageVisible) {
			await expect(emailField).toBeVisible();
			await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();

			await emailField.fill('dasthagiri+usage@easywebinar.com');
			await page.getByRole('textbox', { name: 'Password' }).fill('Welcome@1');
			await Promise.all([
				page.waitForURL(/\/v2\/events/, { timeout: 45000 }),
				page.getByRole('button', { name: 'Log In' }).click(),
			]);
		}

		await expect(page).toHaveURL(/\/v2\/events/, { timeout: 45000 });

		const createWebinarButton = page.getByRole('button', { name: /Create a Webinar/i });
		await expect(createWebinarButton).toBeVisible({ timeout: 20000 });

		const aiWebinarButton = page.getByRole('button', { name: /Create Webinar with AI/i });
		await expect(aiWebinarButton).toBeVisible({ timeout: 20000 });
	});
});

