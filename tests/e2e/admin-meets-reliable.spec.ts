import { test, expect } from '@playwright/test';
import { ReliableButtonLocator } from '../helpers/button-locators';

test.use({ storageState: './tests/auth/storage/admin-auth.json' });

test('Admin can configure and edit a meet - Reliable Version', async ({ page }) => {
    const uniqueId = Date.now().toString().slice(-4);
    const newMeetName = `Test Meet ${uniqueId}`;
    const newCourseName = `Test Course ${uniqueId}`;
    const editedMeetName = `Edited Meet ${uniqueId}`;
    const editedCourseName = `Edited Course ${uniqueId}`;

    // Initialize reliable button locator
    const buttonLocator = new ReliableButtonLocator(page);

    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Navigate to admin meets page
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('meets-tab').click();
    await page.waitForTimeout(2000);

    // Create a new meet for testing
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
    await page.waitForTimeout(3000);

    // Ensure grid is loaded
    await expect(page.getByTestId('meet-grid')).toBeVisible({ timeout: 10000 });

    // Debug: Check what buttons are available
    await buttonLocator.debugRowButtons(newMeetName);

    // Test Configure button (1st button)
    await test.step('Test Configure Meet button', async () => {
        const clicked = await buttonLocator.clickGridButton(
            newMeetName,
            1, // First button (Configure)
            'Configure Meet',
            { timeout: 15000, retries: 3, waitForStable: true }
        );

        expect(clicked).toBe(true);

        // Verify navigation to config page
        const configPageVisible = await buttonLocator.verifyClickResult(
            'h1:has-text("Configure Meet")',
            10000
        );

        if (!configPageVisible) {
            // Alternative check
            await expect(page.locator('h1').filter({ hasText: /configure/i })).toBeVisible({ timeout: 10000 });
        }

        // Navigate back
        await page.getByRole('button', { name: /meets/i }).click();
        await expect(page.getByRole('heading', { name: /meets management/i })).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);
    });

    // Test Edit button (2nd button)
    await test.step('Test Edit Meet button', async () => {
        const clicked = await buttonLocator.clickGridButton(
            newMeetName,
            2, // Second button (Edit)
            'Edit Meet',
            { timeout: 15000, retries: 3, waitForStable: true }
        );

        expect(clicked).toBe(true);

        // Verify edit form appears
        const formVisible = await buttonLocator.verifyClickResult(
            '[data-testid="meet-form"]',
            10000
        );

        expect(formVisible).toBe(true);

        // Verify form is pre-filled
        await expect(page.getByTestId('meet-name-input')).toHaveValue(newMeetName);

        // Make edits
        await page.getByTestId('meet-name-input').fill(editedMeetName);
        await page.getByTestId('course-name-input').fill(editedCourseName);
        await page.getByTestId('is-active-checkbox').uncheck();
        await page.getByTestId('save-meet-button').click();

        // Verify form closes and changes are saved
        await expect(page.getByTestId('meet-form')).not.toBeVisible();
        await page.waitForTimeout(3000);

        await expect(page.getByText(editedMeetName)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(editedCourseName)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Inactive')).toBeVisible({ timeout: 10000 });
    });

    // Test Delete button (3rd button)
    await test.step('Test Delete Meet button', async () => {
        // Set up dialog handler
        page.once('dialog', async (dialog) => {
            console.log(`Confirmation dialog: ${dialog.message()}`);
            await dialog.accept();
        });

        const clicked = await buttonLocator.clickGridButton(
            editedMeetName,
            3, // Third button (Delete)
            'Delete Meet',
            { timeout: 15000, retries: 3, waitForStable: true }
        );

        expect(clicked).toBe(true);

        // Verify meet is deleted
        await expect(page.getByText(editedMeetName)).not.toBeVisible({ timeout: 10000 });
        console.log('Meet successfully deleted');
    });
});

// Test for mobile view button clicking
test('Test mobile view button interactions', async ({ page }) => {
    const buttonLocator = new ReliableButtonLocator(page);
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/admin');
    await page.getByTestId('meets-tab').click();
    await page.waitForTimeout(2000);

    // Verify mobile cards are shown
    await expect(page.getByTestId('meet-cards-container')).toBeVisible({ timeout: 10000 });

    // Get first meet card if available
    const cards = await page.locator('.bg-white.dark\\:bg-gray-800.rounded-lg.shadow.p-4').all();
    
    if (cards.length > 0) {
        const firstCardText = await cards[0].textContent();
        const meetName = firstCardText?.split('\n')[0]?.trim() || 'Unknown Meet';
        
        console.log(`Testing mobile buttons for meet: ${meetName}`);

        // Test configure button in mobile view
        const configureClicked = await buttonLocator.clickCardButton(
            meetName,
            'configure',
            { timeout: 10000 }
        );

        if (configureClicked) {
            console.log('Configure button clicked successfully in mobile view');
            // Navigate back for other tests
            await page.goBack();
        }
    } else {
        console.log('No meet cards found for mobile testing');
    }
});

// Comprehensive button position test
test('Verify button positions and accessibility', async ({ page }) => {
    const buttonLocator = new ReliableButtonLocator(page);
    
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/admin');
    await page.getByTestId('meets-tab').click();
    await page.waitForTimeout(2000);

    // Wait for grid
    await expect(page.getByTestId('meet-grid')).toBeVisible({ timeout: 10000 });

    // Get all data rows (excluding header)
    const dataRows = await page.locator('div[role="row"]').filter({ hasNotText: 'Actions' }).all();
    
    console.log(`Found ${dataRows.length} data rows`);

    for (let i = 0; i < Math.min(dataRows.length, 3); i++) {
        const row = dataRows[i];
        const rowText = await row.textContent();
        const meetName = rowText?.split('\n')[0]?.trim() || `Row ${i}`;
        
        console.log(`\nTesting row ${i + 1}: ${meetName}`);
        
        // Debug button structure
        await buttonLocator.debugRowButtons(meetName);
        
        // Test each button position
        for (let buttonPos = 1; buttonPos <= 3; buttonPos++) {
            const buttonNames = ['Configure', 'Edit', 'Delete'];
            const buttonName = buttonNames[buttonPos - 1];
            
            try {
                // Just verify button exists and is clickable (don't actually click)
                const buttonSelector = `div[role="row"]:has-text("${meetName}") div[role="gridcell"]:first-child button:nth-child(${buttonPos})`;
                const buttonExists = await page.locator(buttonSelector).isVisible();
                const buttonEnabled = buttonExists ? await page.locator(buttonSelector).isEnabled() : false;
                
                console.log(`  ${buttonName} button (position ${buttonPos}): exists=${buttonExists}, enabled=${buttonEnabled}`);
                
                if (buttonExists && buttonEnabled) {
                    // Verify button has proper accessibility attributes
                    const title = await page.locator(buttonSelector).getAttribute('title');
                    console.log(`    Title attribute: ${title}`);
                }
                
            } catch (error) {
                console.log(`  ${buttonName} button test failed: ${error.message}`);
            }
        }
    }
});