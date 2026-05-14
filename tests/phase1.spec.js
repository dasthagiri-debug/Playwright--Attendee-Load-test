const { test, expect } = require('@playwright/test');

// Helper function to generate random delays for human-like interactions.
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// =====================================================================
// BACKGROUND WORKERS (NON-BLOCKING)
// =====================================================================

/**
 * Monitors for NEW polls, votes, waits for results, and resets UI to People tab.
 */
async function monitorForPolls(page) {
    const answeredPolls = new Set(); 
    while (true) {
        try {
            await page.waitForTimeout(5000);
            const pollContainer = page.locator('div').filter({ hasText: 'Active Polls' }).last();

            if (await pollContainer.isVisible().catch(() => false)) {
                const pollSignature = await pollContainer.innerText().catch(() => 'unknown-poll');
                if (answeredPolls.has(pollSignature)) continue; 

                const radioButtons = await pollContainer.getByRole('radio').all();
                if (radioButtons.length > 0) {
                    const randomIndex = Math.floor(Math.random() * radioButtons.length);
                    await radioButtons[randomIndex].click();
                    await page.waitForTimeout(1500);
                    await pollContainer.getByRole('button', { name: /Submit/i }).click();

                    const votedText = pollContainer.getByText(/Voted/i).first();
                    await votedText.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
                    await page.waitForTimeout(3000);
                    
                    const peopleTab = page.locator('a, button, [role="tab"]').filter({ hasText: /People/i }).first();
                    await peopleTab.click({ force: true }).catch(() => {});
                    answeredPolls.add(pollSignature);
                }
            }
        } catch (error) { if (error.message.includes('closed')) break; }
    }
}

/**
 * Monitors for NEW offers, clicks (handling popups), and resets UI to People tab.
 */
async function monitorForOffers(page) {
    const clickedOffers = new Set(); 
    while (true) {
        try {
            await page.waitForTimeout(5000);
            const offerContainer = page.locator('div').filter({ hasText: 'Active Offers' }).last();

            if (await offerContainer.isVisible().catch(() => false)) {
                const offerSignature = await offerContainer.innerText().catch(() => 'unknown-offer');
                if (clickedOffers.has(offerSignature)) continue; 

                const buttonCandidate = offerContainer.locator('button, a, img').last(); 
                const [newPage] = await Promise.all([
                    page.waitForEvent('popup', { timeout: 15000 }).catch(() => null),
                    buttonCandidate.click()
                ]);
                if (newPage) await newPage.close();

                await page.waitForTimeout(2000);
                const peopleTab = page.locator('a, button, [role="tab"]').filter({ hasText: /People/i }).first();
                await peopleTab.click({ force: true }).catch(() => {});
                clickedOffers.add(offerSignature);
            }
        } catch (error) { if (error.message.includes('closed')) break; }
    }
}

// =====================================================================
// MAIN TEST EXECUTION
// =====================================================================

test.setTimeout(40 * 60 * 1000); 

test('Advanced Attendee Journey: Infrastructure, Feature Sweep, and Hold', async ({ page }) => {
    const attendeeUrl = 'https://dasta133.easywebinar.live/live-event-150';
    await page.setViewportSize({ width: 1920, height: 1080 });

    // --- PHASE 1: ORIGINAL INFRASTRUCTURE ---
    await page.goto(attendeeUrl, { waitUntil: 'domcontentloaded' });
    const fullNameField = page.locator('input[placeholder*="Full Name" i]').first();
    const emailField = page.locator('input[placeholder*="Email" i]').first();
    await fullNameField.fill('bot eight');
    await emailField.fill('bot8@gmail.com');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/live-room\/attendee\?/i, { timeout: 60000 });
    const soundOverlay = page.getByText(/click for sound/i).first();
    await soundOverlay.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
    if (await soundOverlay.count()) await soundOverlay.click({ force: true }).catch(() => {});

    // --- PHASE 2: ORIGINAL CHAT GREETING ---
    const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i], [contenteditable="true"]').first();
    await page.waitForTimeout(randomDelay(3000, 6000));
    await chatInput.fill('Hello Admin, bot eight reporting in!');
    await page.keyboard.press('Enter');

    // --- PHASE 3: ORIGINAL INITIAL QUESTION ---
    const questionTab = page.locator('a, button').filter({ hasText: /Question/i }).first();
    await questionTab.click();
    await page.getByRole('button', { name: /Ask a Question/i }).click();
    await page.getByPlaceholder(/Type your question/i).fill('How long is this session?');
    await page.getByRole('button', { name: /Submit Question/i }).click();
    
    // Return to Chat to settle
    await page.locator('a, button').filter({ hasText: /Chat/i }).first().click();

    // =====================================================================
    // --- ADVANCED FEATURE SWEEP (REPEATING PROCESS WITH ALL FEATURES) ---
    // =====================================================================
    console.log('Starting Human-Like Chat Feature Sweep...');

    // 1. Send message with Jitter
    await page.waitForTimeout(randomDelay(5000, 8000));
    await chatInput.fill('Checking out the new features! 🚀');
    await page.waitForTimeout(randomDelay(1000, 2000));
    await page.keyboard.press('Enter');

    // 2. React (Hover & Emoji)
    await page.waitForTimeout(randomDelay(4000, 6000));
    const lastMsg = page.locator('.chat-message-bubble').last();
    await lastMsg.hover();
    await page.waitForTimeout(randomDelay(1500, 3000));
    const emoji = page.locator('.reaction-item, .reaction-list span').first();
    if (await emoji.isVisible()) await emoji.click();

    // 3. Reply with Jitter
    await page.waitForTimeout(randomDelay(5000, 8000));
    const replyBtn = page.locator('.reply-icon, [title*="reply" i]').last();
    if (await replyBtn.isVisible()) {
        await replyBtn.click();
        await page.waitForTimeout(1000);
        await page.keyboard.type("This is a really cool setup!", { delay: randomDelay(100, 250) });
        await page.keyboard.press('Enter');
    }

    // 4. Send & Delete
    await page.waitForTimeout(randomDelay(6000, 9000));
    await chatInput.fill('Typo, deleting this.');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    await page.locator('.chat-message-bubble').last().hover();
    const chatDelete = page.locator('.delete-icon, [title*="delete" i]').last();
    if (await chatDelete.isVisible()) await chatDelete.click();

    console.log('Starting Human-Like Question Feature Sweep...');
    await questionTab.click();
    await page.waitForTimeout(3000);

    // 5. Upvote & Like
    const upvoteBtn = page.locator('.question-card-footer i, .question-card-footer button').first();
    if (await upvoteBtn.isVisible()) await upvoteBtn.click();
    await page.waitForTimeout(2000);
    const likeBtn = page.locator('.question-card-footer i, .question-card-footer button').nth(1);
    if (await likeBtn.isVisible()) await likeBtn.click();

    // 6. Ask & Delete Question
    await page.getByRole('button', { name: /Ask a Question/i }).click();
    await page.getByPlaceholder(/Type your question/i).fill('Testing question deletion logic.');
    await page.getByRole('button', { name: /Submit Question/i }).click();
    await page.waitForTimeout(4000);
    const questionX = page.locator('.question-card .close-icon, .question-card i.fa-times').last();
    await questionX.click();
    await page.locator('button').filter({ hasText: /^Delete$/i }).click();

    // Return to Chat for the long hold
    await page.locator('a, button').filter({ hasText: /Chat/i }).first().click();

    // =====================================================================
    // --- PHASE 4: THE MASTER ENGAGEMENT LOOP (30 MIN) ---
    // =====================================================================
    monitorForPolls(page);
    monitorForOffers(page);

    console.log('Bot fully verified. Entering 30-minute Engagement Loop...');
    const holdDuration = 30 * 60 * 1000; 
    const startTime = Date.now();

    while (Date.now() - startTime < holdDuration) {
        await page.waitForTimeout(randomDelay(120000, 300000)); // 2-5 min rest
        if (Date.now() - startTime >= holdDuration) break;

        const actionIndex = Math.floor(Math.random() * 4) + 1;
        try {
            if (actionIndex === 1) {
                console.log('[WANDERING MIND] Checking People list...');
                await page.locator('a, button').filter({ hasText: /People/i }).first().click({ force: true });
                await page.waitForTimeout(randomDelay(5000, 10000));
                await page.locator('a, button').filter({ hasText: /Chat/i }).first().click();
            } 
            else if (actionIndex === 2) {
                console.log('[WANDERING MIND] Sending reaction...');
                const messages = ["Great point!", "Interesting.", "Agree!", "👍"];
                await chatInput.fill(messages[Math.floor(Math.random() * messages.length)]);
                await page.keyboard.press('Enter');
            }
            else {
                console.log('[WANDERING MIND] Passive watching...');
            }
        } catch (e) { console.log('Action skipped.'); }
    }
});