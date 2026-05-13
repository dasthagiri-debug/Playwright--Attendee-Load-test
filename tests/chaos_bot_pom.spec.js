const { test, expect } = require('@playwright/test');
const WebinarRoom = require('../Pages/WebinarRoom'); // Ensure 'Pages' capitalization matches your folder

// 🚀 THE FIX 1: Force Playwright to run these specific tests concurrently
test.describe.configure({ mode: 'parallel' }); 

// =====================================================================
// BOT SQUAD: 5 Concurrent Bot Profiles (Deterministic Personas)
// =====================================================================
const botSquad = [
    { id: 1, willPoll: true, willOffer: true },
    { id: 2, willPoll: true, willOffer: false },
    { id: 3, willPoll: false, willOffer: true },
    { id: 4, willPoll: true, willOffer: true },
    { id: 5, willPoll: false, willOffer: false }
];

// Standardized human jitter for human-like interactions
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

test.setTimeout(45 * 60 * 1000); // 45 Minutes

for (const botProfile of botSquad) {
    // The test title is now static (Profile 1, Profile 2, etc.)
    test(`Chaos Bot: Profile ${botProfile.id} - Full Lifecycle & Loop`, async ({ page }) => {
        
        // Generate the dynamic identities INSIDE the worker process
        const containerId = process.env.CONTAINER_ID || Math.floor(Math.random() * 90000) + 10000;
        const botName = `Bot ${containerId}-${botProfile.id}`;
        const botEmail = `bot${containerId}_${botProfile.id}@test.com`;

        const attendeeUrl = 'https://dasta133.easywebinar.live/live-event-150';
        const webinar = new WebinarRoom(page);

        // =====================================================================
        // PHASE 1: JOIN & STAGGERED ENTRY
        // =====================================================================
        
        // Multiply the Bot ID by 3 seconds so they queue up and join one by one
        const staggerDelay = botProfile.id * 3000; 
        console.log(`[${botName}] Queued for entry. Waiting ${staggerDelay / 1000} seconds...`);
        await page.waitForTimeout(staggerDelay);

        console.log(`[${botName}] Joining webinar...`);
        await webinar.joinWebinar(attendeeUrl, botName, botEmail);
        console.log(`[${botName}] ✓ Successfully joined.`);
        await page.waitForTimeout(2000);

        // =====================================================================
        // PHASE 2: INITIAL CHAT
        // =====================================================================
        await webinar.sendChat(`Hello Admin, ${botName} reporting in!`);
        console.log(`[${botName}] ✓ Initial greeting sent.`);
        await page.waitForTimeout(2000);

        // =====================================================================
        // PHASE 3: INITIAL QUESTION
        // =====================================================================
        await webinar.askQuestion(`Is there a replay available? Asking for ${botName}.`);
        console.log(`[${botName}] ✓ Initial question asked.`);
        await page.waitForTimeout(2000);

        // =====================================================================
        // PHASE 4: DELETE CHAT TEST
        // =====================================================================
        try {
            const deleteMsgText = `This message from ${botName} is an automated test and will be deleted. 🗑️`;
            await webinar.sendChat(deleteMsgText);
            await page.waitForTimeout(3000);
            
            const msgToDelete = webinar.getMessageByText(deleteMsgText);
            await webinar.deleteMessage(msgToDelete);
            console.log(`[${botName}] ✓ Chat deletion test passed.`);
        } catch (e) {
            console.log(`[${botName}] ⚠ Chat delete failed: ${e.message}`);
        }
        await page.waitForTimeout(2000);

        // =====================================================================
        // PHASE 5: DELETE QUESTION TEST
        // =====================================================================
        try {
            const deleteQText = `This question from ${botName} is a test and will be deleted immediately.`;
            await webinar.askQuestion(deleteQText);
            await page.waitForTimeout(3000);
            
            const qToDelete = webinar.getQuestionByText(deleteQText);
            await webinar.deleteQuestion(qToDelete);
            console.log(`[${botName}] ✓ Question deletion test passed.`);
        } catch (e) {
            console.log(`[${botName}] ⚠ Question delete failed: ${e.message}`);
        }
        await page.waitForTimeout(2000);

        // =====================================================================
        // PHASE 6: REACT, REPLY, & STANDALONE DELETE
        // =====================================================================
        try {
            await webinar.switchToChat();
            const latestMsg = webinar.messageBox.first(); 
            
            await webinar.reactToMessage(latestMsg);
            console.log(`[${botName}] ✓ Reacted to message.`);
            
            await webinar.replyToMessage(latestMsg, 'Agree with this! 🚀');
            console.log(`[${botName}] ✓ Replied to message.`);

            await webinar.switchToQuestion();
            await page.waitForTimeout(500);
            await webinar.switchToChat();
            await page.waitForTimeout(500);

            const typoText = `Disregard this test message. ${botName}`;
            await webinar.sendChat(typoText);
            await page.waitForTimeout(3000); 
            
            const msgToDelete = webinar.getMessageByText(typoText);
            await webinar.deleteMessage(msgToDelete);
            console.log(`[${botName}] ✓ Standalone message sent and deleted successfully.`);

        } catch (e) {
            console.log(`[${botName}] ⚠ Phase 6 action skipped: ${e.message}`);
        }
        await page.waitForTimeout(2000);

        // =====================================================================
        // PHASE 7: INFINITE OMNI-ENGAGEMENT LOOP & RADAR ACTIVATION
        // =====================================================================
        
        webinar.startBackgroundMonitors(botName, botProfile.willPoll, botProfile.willOffer);

        const chatMessages = ["That makes a lot of sense.", "Great point!", "I was wondering about that too.", "Love this! 🚀", "Taking notes on this slide.", "Can totally relate to this.", "Wow, didn't know that.", "🔥", "Agreed."];
        const replyMessages = ["100% this.", "Glad someone said it.", "Good catch!", "Exactly.", "Couldn't agree more."];
        const qaQuestions = ["Will the slides be shared after the session?", "How does this scale for larger teams?", "Do we need any specific software for this?", "Can you share an example of that?", "What happens if we hit the limit?", "Is there a documentation link for this part?"];

        let consecutiveIdles = 0;
        console.log(`[${botName}] Entering Infinite Engagement Loop...`);
        
        while (webinar.isInLiveRoom()) {
            const waitTime = randomDelay(20000, 45000); 
            console.log(`[${botName}] Listening... waiting ${Math.round(waitTime / 1000)}s.`);
            await page.waitForTimeout(waitTime);

            if (!webinar.isInLiveRoom()) {
                console.log(`[${botName}] Redirect detected. Exiting loop...`);
                break;
            }

            let diceRoll = Math.random();

            if (consecutiveIdles >= 2) {
                console.log(`[${botName}] ⚠ Anti-Streak triggered! Forcing action.`);
                diceRoll = 0.20; 
            }

            try {
                if (diceRoll < 0.30) {
                    consecutiveIdles = 0;
                    const msg = chatMessages[Math.floor(Math.random() * chatMessages.length)];
                    await webinar.sendChat(msg);
                    console.log(`[${botName}] -> Sent Chat: "${msg}"`);

                } else if (diceRoll < 0.45) {
                    consecutiveIdles = 0;
                    const qTxt = qaQuestions[Math.floor(Math.random() * qaQuestions.length)];
                    await webinar.askQuestion(qTxt);
                    console.log(`[${botName}] -> Asked Question: "${qTxt}"`);

                } else if (diceRoll < 0.60) {
                    consecutiveIdles = 0;
                    await webinar.switchToChat();
                    const latestMsg = webinar.messageBox.last();
                    if (await latestMsg.isVisible().catch(() => false)) {
                        await webinar.reactToMessage(latestMsg);
                        console.log(`[${botName}] -> Reacted 👏 to the latest message.`);
                    }

                } else if (diceRoll < 0.75) {
                    consecutiveIdles = 0;
                    await webinar.switchToChat();
                    const latestMsg = webinar.messageBox.last();
                    if (await latestMsg.isVisible().catch(() => false)) {
                        const replyTxt = replyMessages[Math.floor(Math.random() * replyMessages.length)];
                        await webinar.replyToMessage(latestMsg, replyTxt);
                        console.log(`[${botName}] -> Replied: "${replyTxt}"`);
                    }

                } else if (diceRoll < 0.80) {
                    consecutiveIdles = 0;
                    
                    await webinar.switchToQuestion();
                    await page.waitForTimeout(500);
                    await webinar.switchToChat();
                    await page.waitForTimeout(500);

                    const typoMsg = `Oops, typing too fast! ${Math.random()}`;
                    await webinar.sendChat(typoMsg);
                    await page.waitForTimeout(2000); 
                    
                    const msgToDelete = webinar.getMessageByText(typoMsg);
                    await webinar.deleteMessage(msgToDelete);
                    console.log(`[${botName}] -> Sent and deleted a standalone typo message.`);

                } else {
                    consecutiveIdles++;
                    console.log(`[${botName}] -> Idle (Streak: ${consecutiveIdles})`);
                }
            } catch (loopError) {
                console.log(`[${botName}] ⚠ Action skipped gracefully: ${loopError.message}`);
            }
        }

        console.log(`[${botName}] Webinar ended! Disconnecting gracefully.`);
    });
}