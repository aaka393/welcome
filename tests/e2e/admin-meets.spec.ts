import { test, expect } from '@playwright/test';

test.use({ storageState: './tests/auth/storage/admin-auth.json' });

test('Admin can configure and edit a meet', async ({ page }) => {
    const uniqueId = Date.now().toString().slice(-4);
    const newMeetName = `Test Meet ${uniqueId}`;
    const newCourseName = `Test Course ${uniqueId}`;
    const editedMeetName = `Edited Meet ${uniqueId}`;
    const editedCourseName = `Edited Course ${uniqueId}`;

    // Set a larger viewport to ensure desktop view
    await page.setViewportSize({ width: 1280, height: 720 });

    // 1. Go to the Meets page
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('meets-tab').click();
    await page.waitForTimeout(2000); // Wait for tab content to load

    // 2. Add a new meet to test against
    await page.getByTestId('add-meet-button').click();
    await expect(page.getByTestId('meet-form')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('meet-name-input').fill(newMeetName);
    await page.getByTestId('course-name-input').fill(newCourseName);
    await page.getByTestId('start-date-input').fill('2025-09-01');
    await page.getByTestId('end-date-input').fill('2025-09-30');
    await page.getByTestId('handicap-percentage-input').fill('10.5');
    await page.getByTestId('is-active-checkbox').check();
    await page.getByTestId('save-meet-button').click();
    await expect(page.getByTestId('meet-form')).not.toBeVisible();
    
    // Wait for the grid to refresh and show the new meet
    await page.waitForTimeout(3000);

    // Wait for the grid to be visible and loaded
    await expect(page.getByTestId('meet-grid')).toBeVisible({ timeout: 10000 });

    // Helper function to reliably click buttons using nth-child selectors
    const clickButtonInRow = async (meetName: string, buttonPosition: number, buttonName: string) => {
        console.log(`Attempting to click ${buttonName} button for meet: ${meetName}`);
        
        // Strategy 1: Find the specific data row by looking for meet name in the grid
        // First, let's find all data rows and identify the correct one
        const allRows = await page.locator('div[role="row"]').all();
        let targetRowIndex = -1;
        
        for (let i = 0; i < allRows.length; i++) {
            const rowText = await allRows[i].textContent();
            if (rowText && rowText.includes(meetName)) {
                // Make sure this row actually has buttons (not a header row)
                const buttonsInRow = await allRows[i].locator('button').count();
                if (buttonsInRow > 0) {
                    targetRowIndex = i;
                    console.log(`Found target row at index ${i} with ${buttonsInRow} buttons`);
                    break;
                }
            }
        }
        
        if (targetRowIndex === -1) {
            throw new Error(`Could not find data row with meet name "${meetName}" that contains buttons`);
        }
        
        try {
            // Strategy 1: Use the identified row index to click the button
            const targetRow = allRows[targetRowIndex];
            const buttons = await targetRow.locator('button').all();
            
            if (buttons.length < buttonPosition) {
                throw new Error(`Row only has ${buttons.length} buttons, cannot click position ${buttonPosition}`);
            }
            
            const targetButton = buttons[buttonPosition - 1]; // Convert to 0-based index
            
            // Verify button is enabled before clicking
            const isEnabled = await targetButton.isEnabled();
            if (!isEnabled) {
                throw new Error(`${buttonName} button is disabled`);
            }
            
            // Scroll into view and click
            await targetButton.scrollIntoViewIfNeeded();
            await targetButton.click({ timeout: 5000 });
            console.log(`Successfully clicked ${buttonName} button using row index approach`);
            return true;
            
        } catch (error) {
            console.log(`Row index strategy failed for ${buttonName}: ${error.message}`);
            
            // Strategy 2: Try with test-id approach (fallback)
            try {
                // Look for buttons with specific test-ids that might contain meet ID
                const buttonTestIds = [
                    `configure-meet-button-`,
                    `edit-meet-button-`,
                    `delete-meet-button-`
                ];
                const targetTestIdPrefix = buttonTestIds[buttonPosition - 1];
                
                // Try to find button by partial test-id match
                const testIdButtons = await page.locator(`button[data-testid^="${targetTestIdPrefix}"]`).all();
                
                for (const button of testIdButtons) {
                    // Check if this button is in a row that contains our meet name
                    const buttonRow = button.locator('xpath=ancestor::div[@role="row"]');
                    const rowText = await buttonRow.textContent();
                    
                    if (rowText && rowText.includes(meetName)) {
                        await button.scrollIntoViewIfNeeded();
                        await button.click({ timeout: 5000 });
                        console.log(`Successfully clicked ${buttonName} button using test-id approach`);
                        return true;
                    }
                }
                
                throw new Error(`No ${buttonName} button found with test-id approach`);
                
            } catch (testIdError) {
                console.log(`Test-id strategy failed for ${buttonName}: ${testIdError.message}`);
                
                // Strategy 3: Direct button search by title within grid
                try {
                    const buttonTitles = ['Configure Meet', 'Edit Meet', 'Delete Meet'];
                    const expectedTitle = buttonTitles[buttonPosition - 1];
                    
                    // Get all buttons with this title
                    const titleButtons = await page.locator(`button[title="${expectedTitle}"]`).all();
                    
                    for (const button of titleButtons) {
                        // Check if this button is in a row that contains our meet name
                        const buttonRow = button.locator('xpath=ancestor::div[@role="row"]');
                        const rowText = await buttonRow.textContent();
                        
                        if (rowText && rowText.includes(meetName)) {
                            await button.scrollIntoViewIfNeeded();
                            await button.click({ timeout: 5000 });
                            console.log(`Successfully clicked ${buttonName} button using title search`);
                            return true;
                        }
                    }
                    
                    throw new Error(`No ${buttonName} button found in row with "${meetName}"`);
                    
                } catch (titleError) {
                    console.log(`All strategies failed for ${buttonName}: ${titleError.message}`);
                    throw new Error(`Failed to click ${buttonName} button after trying all strategies`);
                }
            }
        }
    };

    // Helper function to verify button click success
    const verifyButtonClick = async (expectedResult: string, timeout: number = 10000) => {
        try {
            await page.waitForSelector(expectedResult, { timeout });
            return true;
        } catch (error) {
            console.log(`Verification failed: ${error.message}`);
            return false;
        }
    };

    // --- TEST CONFIGURE BUTTON (1st button - nth-child(1)) ---
    await test.step('Test "Configure Meet" button', async () => {
        // Click Configure button (1st button in actions cell)
        await clickButtonInRow(newMeetName, 1, 'Configure Meet');

        // Verify navigation to configuration page
        const configPageHeading = `h1:has-text("Configure Meet: ${newMeetName}")`;
        const isConfigPageVisible = await verifyButtonClick(configPageHeading);
        
        if (!isConfigPageVisible) {
            // Alternative verification - look for any configuration-related heading
            await expect(page.locator('h1').filter({ hasText: /configure meet/i })).toBeVisible({ timeout: 10000 });
        }

        // Go back to the Meets Management page
        await page.getByRole('button', { name: /meets/i }).click();
        await expect(page.getByRole('heading', { name: /meets management/i })).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);
    });

    // --- TEST EDIT BUTTON (2nd button - nth-child(2)) ---
    await test.step('Test "Edit Meet" button', async () => {
        // Click Edit button (2nd button in actions cell)
        await clickButtonInRow(newMeetName, 2, 'Edit Meet');

        // Verify edit form appears
        const editFormVisible = await verifyButtonClick('[data-testid="meet-form"]');
        
        if (!editFormVisible) {
            throw new Error('Edit form did not appear after clicking Edit button');
        }

        // Verify the form is pre-filled with the original meet name
        await expect(page.getByTestId('meet-name-input')).toHaveValue(newMeetName);

        // Edit the meet details
        await page.getByTestId('meet-name-input').fill(editedMeetName);
        await page.getByTestId('course-name-input').fill(editedCourseName);
        await page.getByTestId('is-active-checkbox').uncheck();
        await page.getByTestId('save-meet-button').click();

        // After saving, the form should disappear
        await expect(page.getByTestId('meet-form')).not.toBeVisible();
        await page.waitForTimeout(3000);

        // Verify the meet grid shows the updated information
        await expect(page.getByText(editedMeetName)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(editedCourseName)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Inactive')).toBeVisible({ timeout: 10000 });
    });

    // --- TEST DELETE BUTTON (3rd button - nth-child(3)) ---
    await test.step('Clean up: Delete the meet', async () => {
        // Set up dialog handler for confirmation
        page.once('dialog', async (dialog) => {
            console.log(`Dialog appeared: ${dialog.message()}`);
            await dialog.accept();
        });

        // Click Delete button (3rd button in actions cell)
        await clickButtonInRow(editedMeetName, 3, 'Delete Meet');

        // Verify the meet is removed from the grid
        await expect(page.getByText(editedMeetName)).not.toBeVisible({ timeout: 10000 });
        console.log('Meet successfully deleted');
    });
});

// Additional helper test for debugging button positions
test('Debug button positions in MeetGrid', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/admin');
    await page.getByTestId('meets-tab').click();
    await page.waitForTimeout(2000);

    // Wait for grid to load
    await expect(page.getByTestId('meet-grid')).toBeVisible({ timeout: 10000 });

    // Get all rows and analyze button structure
    const rows = await page.locator('div[role="row"]').all();
    
    for (let i = 0; i < Math.min(rows.length, 3); i++) {
        const row = rows[i];
        const rowText = await row.textContent();
        console.log(`Row ${i}: ${rowText}`);
        
        // Count buttons in the first cell (actions cell)
        const buttons = await row.locator('div[role="gridcell"]:first-child button').all();
        console.log(`Row ${i} has ${buttons.length} buttons`);
        
        for (let j = 0; j < buttons.length; j++) {
            const button = buttons[j];
            const title = await button.getAttribute('title');
            const classes = await button.getAttribute('class');
            console.log(`  Button ${j + 1}: title="${title}", classes="${classes}"`);
        }
    }
});

// Test for mobile view (cards) button clicking
test('Test mobile view button clicking', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/admin');
    await page.getByTestId('meets-tab').click();
    await page.waitForTimeout(2000);

    // In mobile view, buttons should be in cards
    const cards = await page.getByTestId('meet-cards-container');
    await expect(cards).toBeVisible({ timeout: 10000 });

    // Mobile buttons have different test IDs with meet ID suffix
    const firstCard = await page.locator('.bg-white.dark\\:bg-gray-800.rounded-lg.shadow.p-4').first();
    
    if (await firstCard.isVisible()) {
        // Try to find and click configure button in mobile view
        const configureBtn = await firstCard.locator('button[title="Configure Meet"]').first();
        if (await configureBtn.isVisible()) {
            await configureBtn.click();
            console.log('Successfully clicked configure button in mobile view');
        }
    }
});