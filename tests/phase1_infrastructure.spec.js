const { test, expect } = require('@playwright/test');

// Standardized human jitter for human-like interactions
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// =====================================================================
// BACKGROUND WORKERS (RUNS IN PARALLEL)
// =====================================================================
async function monitorForPolls(page) {
    const answeredPolls = new Set(); 
    while (true) {
        try {
            await page.waitForTimeout(5000); 
            const pollContainer = page.locator('div').filter({ hasText: 'Active Polls' }).last();
            if (await pollContainer.isVisible().catch(() => false)) {
                const pollSignature = await pollContainer.innerText().catch(() => 'unknown-poll');
                if (answeredPolls.has(pollSignature)) continue; 

                const radioButtons = await page.getByRole('radio').all();
                if (radioButtons.length > 0) {
                    await radioButtons[Math.floor(Math.random() * radioButtons.length)].click();
                    await page.waitForTimeout(1000);
                    await pollContainer.getByRole('button', { name: /Submit/i }).click();
                    await page.locator('a, button').filter({ hasText: /People/i }).first().click({ force: true }).catch(() => {});
                    answeredPolls.add(pollSignature);
                    console.log('[POLL] ✓ Voted.');
                }
            }
        } catch (e) { if (e.message.includes('closed')) break; }
    }
}

async function monitorForOffers(page) {
    const clickedOffers = new Set(); 
    while (true) {
        try {
            await page.waitForTimeout(5000);
            const offerContainer = page.locator('div').filter({ hasText: 'Active Offers' }).last();
            if (await offerContainer.isVisible().catch(() => false)) {
                const offerSignature = await offerContainer.innerText().catch(() => 'unknown-offer');
                if (clickedOffers.has(offerSignature)) continue; 

                const actionElement = offerContainer.locator('button, a, img').last();
                const [newPage] = await Promise.all([
                    page.waitForEvent('popup', { timeout: 15000 }).catch(() => null),
                    actionElement.click({ force: true })
                ]);
                if (newPage) await newPage.close();
                await page.locator('a, button').filter({ hasText: /People/i }).first().click({ force: true }).catch(() => {});
                clickedOffers.add(offerSignature);
                console.log('[OFFER] ✓ Clicked.');
            }
        } catch (e) { if (e.message.includes('closed')) break; }
    }
}

// =====================================================================
// MAIN TEST FLOW
// =====================================================================
test.setTimeout(45 * 60 * 1000); // 45 Minutes

test.only('Master E2E: Join > Core Tests > Chaos Engagement Loop', async ({ page }) => {
    const attendeeUrl = 'https://dasta133.easywebinar.live/live-event-150';
    await page.setViewportSize({ width: 1920, height: 1080 });

    // --- PHASE 1: JOIN ---
    await page.goto(attendeeUrl, { waitUntil: 'domcontentloaded' });
    
    const fullNameField = page.locator('input[placeholder*="Full Name" i], input[name*="name" i], input[type="text"]').first();
    const emailField = page.locator('input[placeholder*="Email" i], input[type="email"], input[name*="email" i]').first();

    await expect(fullNameField).toBeVisible({ timeout: 20000 });
    await fullNameField.fill('bot seven');
    await emailField.fill('bot7@gmail.com');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/live-room\/attendee\?/i, { timeout: 60000 });

    const soundOverlay = page.getByText(/click for sound/i).first();
    if (await soundOverlay.isVisible()) await soundOverlay.click({ force: true });

    // Activate Background Monitors
    monitorForPolls(page);
    monitorForOffers(page);

    // --- PHASE 2: INITIAL CHAT ---
    console.log('Switching to Chat Tab...');
    const chatTabInitial = page.locator('a, button, div.tab-item').filter({ hasText: /^Chat$/i }).first();
    await chatTabInitial.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1500);

    const chatInput = page.locator('input[placeholder*="message" i], input[placeholder*="chat" i], textarea[placeholder*="message" i], textarea[placeholder*="type" i], [contenteditable="true"]').first();
    await expect(chatInput).toBeVisible({ timeout: 15000 });
    await chatInput.fill('Hello Admin, bot seven reporting in!');
    await page.keyboard.press('Enter');
    console.log('✓ Greeting sent.');
    await page.waitForTimeout(2000);

    // --- PHASE 3: QUESTION ---
    try {
        console.log('Switching to Question Tab...');
        const questionTab = page.locator('a, button, div.tab-item').filter({ hasText: /Question|Q&A/i }).first();
        await expect(questionTab).toBeVisible({ timeout: 20000 });
        
        await questionTab.evaluate(el => el.click()).catch(async () => {
            await questionTab.click({ force: true });
        });
        await page.waitForTimeout(2000); // 2-second buffer for animation

        const askButton = page.getByRole('button', { name: /Ask a Question/i }).first();
        await expect(askButton).toBeVisible({ timeout: 20000 });
        await askButton.click({ timeout: 10000 });
        console.log('-> Clicked Ask a Question button');

        const questionInput = page.getByPlaceholder('Type your question..');
        await expect(questionInput).toBeVisible({ timeout: 15000 });
        await questionInput.fill('Is there a replay available for this session?');
        await page.waitForTimeout(1000);

        const submitQuestionButton = page.getByRole('button', { name: /Submit Question/i });
        await expect(submitQuestionButton).toBeVisible({ timeout: 10000 });
        await submitQuestionButton.click({ timeout: 10000 });
        console.log('✓ Question submitted.');
        await page.waitForTimeout(2000);

    } catch (e) {
        console.log('⚠ Question Phase stalled: ' + e.message);
    } finally {
        // --- PHASE 4: RETURN TO CHAT, REACT, & REPLY ---
        console.log('Switching to Chat for Reaction/Reply...');
        const chatTab = page.locator('a, button, div.tab-item').filter({ hasText: /^Chat$/i }).first();
        
        await chatTab.evaluate(el => el.click()).catch(async () => {
            await chatTab.click({ force: true });
        });
        await page.waitForTimeout(2000); // 2-second buffer for animation

        try {
            const messageBox = page.locator('.flex.message-box').last();
            await messageBox.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
            await page.waitForTimeout(1500);
            
            // React
            await messageBox.hover({ force: true });
            const reactionBar = messageBox.locator('.emoji-reaction-bar');
            await reactionBar.waitFor({ state: 'visible', timeout: 5000 });
            await reactionBar.locator('.emoji-btn').filter({ hasText: '👏' }).click({ force: true });
            console.log('✓ Reaction applied.');

            // Reply
            await messageBox.hover({ force: true }); 
            await messageBox.locator('a.reply-chat').click({ force: true });
            await page.waitForTimeout(1500);
            
            await chatInput.pressSequentially('Agree with this! 🚀', { delay: 50 });
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');
            console.log('✓ Reply sent.');
            await page.waitForTimeout(2000);
            
        } catch (err) {
            console.log('⚠ Chat actions sequence skipped: ' + err.message);
        }

        // --- PHASE 5: SEND & DELETE CHAT MESSAGE ---
        console.log('Testing Send & Delete Chat feature...');
        try {
            await chatInput.click({ force: true });
            await page.waitForTimeout(500);
            await chatInput.pressSequentially('This message is an automated test and will be deleted. 🗑️', { delay: 50 });
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');
            console.log('✓ "To-be-deleted" chat sent.');

            await page.waitForTimeout(3000);

            const messageToDelete = page.locator('.flex.message-box').last();
            await messageToDelete.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
            await page.waitForTimeout(1000);
            await messageToDelete.hover({ force: true });
            await page.waitForTimeout(1000); 

            const deleteIcon = messageToDelete.locator('a.delete-chat').first();
            await deleteIcon.evaluate(node => node.click()).catch(async () => {
                await deleteIcon.click({ force: true }); 
            });
            console.log('-> Clicked the chat delete link.');

            const confirmBtn = page.locator('button.warning-button').filter({ hasText: /^Delete$/i }).first();
            await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
            await confirmBtn.click();
            console.log('✓ Chat deletion confirmed via modal.');
            await page.waitForTimeout(2000); 

        } catch (err) {
            console.log('⚠ Send/Delete Chat sequence skipped or failed: ' + err.message);
        }

        // --- PHASE 6: SEND & DELETE QUESTION ---
        console.log('Testing Send & Delete Question feature...');
        try {
            console.log('Switching back to Question Tab...');
            const questionTab = page.locator('a, button, div.tab-item').filter({ hasText: /Question|Q&A/i }).first();
            await questionTab.click({ force: true }).catch(() => questionTab.evaluate(el => el.click()));
            await page.waitForTimeout(2000);

            const askButton = page.getByRole('button', { name: /Ask a Question/i }).first();
            await askButton.waitFor({ state: 'visible', timeout: 5000 });
            await askButton.click();
            await page.waitForTimeout(1000);

            const dummyQText = 'This question is a test and will be deleted immediately.';
            const questionInput = page.getByPlaceholder('Type your question..');
            await questionInput.fill(dummyQText);
            await page.waitForTimeout(500);

            const submitQuestionButton = page.getByRole('button', { name: /Submit Question/i });
            await submitQuestionButton.click();
            console.log('✓ "To-be-deleted" question submitted.');
            
            await page.waitForTimeout(3000); 

            const targetQuestion = page.locator('div.mb-4.p-4').filter({ hasText: dummyQText }).first();
            await targetQuestion.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
            await page.waitForTimeout(1000);

            const crossBtn = targetQuestion.locator('div.items-start > button').first();
            await crossBtn.evaluate(node => node.click()).catch(async () => {
                await crossBtn.click({ force: true });
            });
            console.log('-> Clicked the cross (X) icon on the question.');

            const deletePopupBtn = page.locator('.delete-popup-area button').filter({ hasText: /^Delete$/i }).first();
            await deletePopupBtn.waitFor({ state: 'visible', timeout: 5000 });
            await deletePopupBtn.click();
            console.log('✓ Question deletion confirmed via pop-up.');
            await page.waitForTimeout(2000);

        } catch (err) {
            console.log('⚠ Send/Delete Question sequence skipped or failed: ' + err.message);
        }
    }

    // --- PHASE 7: INFINITE ENGAGEMENT LOOP (UNTIL ADMIN ENDS WEBINAR) ---
    console.log('Bot entering Infinite Engagement Loop. Will run until redirected out of the live room...');
    
    const chatMessages = [
        "That makes a lot of sense.",
        "Great point!",
        "I was wondering about that too.",
        "Love this! 🚀",
        "Taking notes on this slide.",
        "Can totally relate to this.",
        "Wow, didn't know that.",
        "🔥",
        "Agreed."
    ];

    const qaQuestions = [
        "Will the slides be shared after the session?",
        "How does this scale for larger teams?",
        "Do we need any specific software for this?",
        "Can you share an example of that?",
        "What happens if we hit the limit?",
        "Is there a documentation link for this part?"
    ];

    let consecutiveIdles = 0; 

    // The moment the admin ends the webinar and redirects to a Thank You page, this becomes false!
    while (page.url().includes('live-room')) {
        
        const waitTime = randomDelay(20000, 60000);
        console.log(`Bot is listening... waiting ${Math.round(waitTime/1000)} seconds.`);
        await page.waitForTimeout(waitTime);

        // Double-check the URL AFTER waking up from the wait
        if (!page.url().includes('live-room')) {
            console.log('Redirect detected while sleeping. Exiting loop...');
            break; 
        }

        let diceRoll = Math.random();

        if (consecutiveIdles >= 2) {
            console.log('⚠ Anti-Streak triggered! Forcing an action.');
            diceRoll = 0.20; 
        }

        try {
            if (diceRoll < 0.40) {
                // CHAT ACTION
                consecutiveIdles = 0; 
                console.log('-> Action chosen: Send Chat');
                
                const currentChatInput = page.locator('input[placeholder*="message" i], input[placeholder*="chat" i], textarea[placeholder*="message" i], textarea[placeholder*="type" i], [contenteditable="true"]').first();
                
                // THE FIX: Only click the Chat tab if the input box is currently hidden
                if (!(await currentChatInput.isVisible())) {
                    console.log('Chat not visible. Opening Chat tab...');
                    const chatTab = page.locator('a, button, div.tab-item').filter({ hasText: /^Chat$/i }).first();
                    await chatTab.click({ force: true }).catch(() => chatTab.evaluate(el => el.click()));
                    await page.waitForTimeout(1000);
                }
                
                const msg = chatMessages[Math.floor(Math.random() * chatMessages.length)];
                await currentChatInput.click({ force: true });
                await currentChatInput.pressSequentially(msg, { delay: randomDelay(30, 80) }); 
                await page.waitForTimeout(500);
                await page.keyboard.press('Enter');
                console.log(`✓ Sent chat: "${msg}"`);

            } else if (diceRoll < 0.65) {
                // QUESTION ACTION
                consecutiveIdles = 0; 
                console.log('-> Action chosen: Ask Question');
                
                const askBtn = page.getByRole('button', { name: /Ask a Question/i }).first();
                
                // THE FIX: Only click the Question tab if the "Ask" button is currently hidden
                if (!(await askBtn.isVisible())) {
                    console.log('Q&A not visible. Opening Question tab...');
                    const questionTab = page.locator('a, button, div.tab-item').filter({ hasText: /Question|Q&A/i }).first();
                    await questionTab.click({ force: true }).catch(() => questionTab.evaluate(el => el.click()));
                    await page.waitForTimeout(1500);
                }

                if (await askBtn.isVisible()) {
                    await askBtn.click();
                    await page.waitForTimeout(1000);
                    
                    const qTxt = qaQuestions[Math.floor(Math.random() * qaQuestions.length)];
                    const qInput = page.getByPlaceholder('Type your question..');
                    await qInput.fill(qTxt);
                    await page.waitForTimeout(500);
                    
                    await page.getByRole('button', { name: /Submit Question/i }).click();
                    console.log(`✓ Asked question: "${qTxt}"`);
                }
            } else {
                // IDLE ACTION
                consecutiveIdles++; 
                console.log(`-> Action chosen: Idle (Streak: ${consecutiveIdles})`);
            }
        } catch (loopError) {
            console.log(`⚠ Action interrupted (likely by redirection): ${loopError.message}`);
        }
    }

    console.log('Webinar ended! Redirect successful. Bot disconnecting gracefully.');
});