const { test, expect } = require('@playwright/test');
// FIX: Changed 'Pages' to 'pages' to match your folder structure
const { WebinarPage } = require('../Pages/WebinarPage'); 

test('Locators Mastery - POM Version', async ({ page }) => {
    const webinar = new WebinarPage(page);

    await webinar.navigate();
    await webinar.fillInitialDetails('Playwright mastery class', 'Lesson1');
    
    await webinar.selectVideo('10 Min');
    
    await webinar.completeWebinar();

    // Final Verification
    await expect(page.getByRole('heading', { name: 'My Webinars' })).toBeVisible();
});