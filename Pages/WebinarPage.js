const { expect } = require('@playwright/test');

class WebinarPage {
    constructor(page) {
        this.page = page;
        this.createBtn = page.getByRole('button', { name: 'Create a Webinar' });
        this.titleInput = page.getByPlaceholder('e.g., Master Email Marketing in 60 Minutes');
        this.tagsInput = page.getByRole('combobox', { name: /e.g., marketing, email/i });
        this.liveWebinarRadio = page.getByRole('radio', { name: /^Live Webinar\b/i });
        this.freeRegistrationBtn = page.getByRole('button', { name: /^Free$/ });
        this.nextSchedulingBtn = page.getByRole('button', { name: /Next : Scheduling Options/i });
        this.timezoneDropdown = page.getByRole('listbox', { name: 'Webinar Timezone' });
        this.dateInput = page.getByRole('textbox', { name: 'Date' });
        this.openCalendarBtn = page.getByRole('button', { name: 'Open calendar' });
        this.timeInput = page.getByRole('textbox', { name: 'Time' });
        this.nextTemplateBtn = page.getByRole('button', { name: /Next : Template Selection/i });
        this.skipToDashboardBtn = page.getByRole('button', { name: /Skip\s*&\s*Next:\s*Dashboard/i });

        // Legacy selectors kept for existing tests in this workspace.
        this.evergreenType = page.getByText('Evergreen Webinar', { exact: true });
        this.nextVideoBtn = page.getByRole('button', { name: /Next : Video Selection/i });
        this.videoPathSelector = (duration) =>
            page.locator('.event-video-column', { hasText: duration }).locator('.ew-hover-element > path').first();
        this.continueTemplatesBtn = page.getByRole('button', { name: 'Continue to Templates' });
    }

    async addTag(tag) {
        await this.tagsInput.click({ timeout: 10000 });
        await this.tagsInput.fill(tag, { timeout: 10000 });

        try {
            await this.tagsInput.press('Enter', { timeout: 5000 });
        } catch {
            // Fallback for flaky chip inputs where Enter intermittently hangs.
            await this.tagsInput.press('Tab', { timeout: 5000 });
        }

        await expect(this.tagsInput).toHaveValue(/\s*$/, { timeout: 10000 });
    }

    async navigate() {
        await this.page.goto('https://accounts-uat.easywebinar.com/login', {
            waitUntil: 'domcontentloaded',
        });
        await this.page.waitForURL(/uat\.easywebinar\.com\/(v2\/events|ew-auto-login)/, { timeout: 60000 });
        await expect(this.createBtn).toBeVisible({ timeout: 30000 });
    }

    async clickCreateWebinar() {
        await this.createBtn.click();
        await expect(this.page.getByRole('heading', { name: 'Create a Webinar' })).toBeVisible();
    }

    async chooseLiveWebinarType() {
        await this.liveWebinarRadio.check();
    }

    async fillBasicInfo({ title, tag }) {
        await this.titleInput.fill(title, { timeout: 10000 });
        await this.addTag(tag);
        await this.freeRegistrationBtn.click({ timeout: 10000 });
        await expect(this.nextSchedulingBtn).toBeEnabled({ timeout: 15000 });
        await this.nextSchedulingBtn.click({ timeout: 10000 });
    }

    async selectTimezone(timezoneLabel) {
        await this.timezoneDropdown.click();
        await this.page.getByRole('option', { name: new RegExp(timezoneLabel, 'i') }).click();
        await expect(this.timezoneDropdown).toContainText(/Kolkata/i);
    }

    async setSchedule({ targetDate, timeText }) {
        const targetMonthYear = targetDate.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
        }).toUpperCase();
        const targetAriaLabel = targetDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });

        await this.openCalendarBtn.click({ timeout: 10000 });
        const monthYearButton = this.page.getByRole('button', { name: 'Choose month and year' });
        for (let i = 0; i < 24; i += 1) {
            const currentMonthYear = (await monthYearButton.textContent())?.trim();
            if (currentMonthYear === targetMonthYear) {
                break;
            }
            await this.page.getByRole('button', { name: 'Next month' }).click({ timeout: 10000 });
        }

        await this.page.getByRole('gridcell', { name: targetAriaLabel }).click({ timeout: 10000 });
        await this.timeInput.fill(timeText, { timeout: 10000 });
        await this.timeInput.press('Enter', { timeout: 10000 });

        await expect(this.nextTemplateBtn).toBeEnabled({ timeout: 15000 });
    }

    async finalizeCreation() {
        await this.nextTemplateBtn.click();
        await expect(this.page.getByRole('heading', { name: 'Pick Your Template' })).toBeVisible();
        await this.skipToDashboardBtn.click();
        await this.page.waitForURL(/\/v2\/events\/\d+\/schedule/, { timeout: 60000 });
    }

    // Legacy methods retained for existing tests.
    async fillInitialDetails(name, tag) {
        await this.clickCreateWebinar();
        await this.titleInput.fill(name);
        await this.evergreenType.click();
        await this.addTag(tag);
        await this.nextSchedulingBtn.click();
        await this.nextVideoBtn.click();
    }

    async selectVideo(duration) {
        const targetPath = this.videoPathSelector(duration);
        await targetPath.scrollIntoViewIfNeeded();
        await targetPath.hover();
        await targetPath.click();
        await this.continueTemplatesBtn.click();
    }

    async completeWebinar() {
        await this.skipToDashboardBtn.click();
    }
}

module.exports = { WebinarPage };