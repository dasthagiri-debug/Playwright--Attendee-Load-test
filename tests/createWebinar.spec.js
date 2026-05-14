const { test, expect } = require('@playwright/test');
const { WebinarPage } = require('../Pages/WebinarPage');

function getDatePlusDays(daysToAdd) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

test.describe('Create Live Webinar', () => {
  test('creates a live webinar with future schedule', async ({ page }) => {
    test.setTimeout(120000);
    const webinarPage = new WebinarPage(page);
    const uniqueTitle = `Masterclass ${new Date().getFullYear()} ${Date.now()}`;
    const targetDate = getDatePlusDays(14);

    await webinarPage.navigate();
    await webinarPage.clickCreateWebinar();
    await webinarPage.chooseLiveWebinarType();
    await webinarPage.fillBasicInfo({
      title: uniqueTitle,
      tag: 'automation',
    });

    await webinarPage.selectTimezone('Kolkata');
    await webinarPage.setSchedule({
      targetDate,
      timeText: '10:00 AM',
    });

    await webinarPage.finalizeCreation();

    await expect(page).toHaveURL(/\/v2\/events\/\d+\/schedule/);
    await expect(page.getByRole('heading', { name: /Webinar Overview/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: new RegExp(uniqueTitle, 'i') })).toBeVisible();
  });
});
