/**
 * Reliable button locator utilities for AG Grid and complex DOM structures
 * Uses nth-child selectors and multiple fallback strategies
 */

import { Page, Locator } from '@playwright/test';

export interface ButtonClickOptions {
    timeout?: number;
    retries?: number;
    waitForStable?: boolean;
}

export class ReliableButtonLocator {
    constructor(private page: Page) {}

    /**
     * Click a button in an AG Grid row using multiple strategies
     * @param rowIdentifier - Text content to identify the row
     * @param buttonPosition - Position of button (1-based index)
     * @param buttonName - Name for logging purposes
     * @param options - Click options
     */
    async clickGridButton(
        rowIdentifier: string,
        buttonPosition: number,
        buttonName: string,
        options: ButtonClickOptions = {}
    ): Promise<boolean> {
        const { timeout = 10000, retries = 3, waitForStable = true } = options;
        
        console.log(`Attempting to click ${buttonName} button (position ${buttonPosition}) for row: ${rowIdentifier}`);

        for (let attempt = 1; attempt <= retries; attempt++) {
            console.log(`Attempt ${attempt}/${retries}`);

            try {
                // Strategy 1: Standard AG Grid row with nth-child
                const success = await this.tryClickStrategy(
                    `div[role="row"]:has-text("${rowIdentifier}") div[role="gridcell"]:first-child button:nth-child(${buttonPosition})`,
                    buttonName,
                    timeout,
                    waitForStable
                );
                
                if (success) return true;

                // Strategy 2: AG Grid center container
                const success2 = await this.tryClickStrategy(
                    `.ag-center-cols-container div[role="row"]:has-text("${rowIdentifier}") .ag-cell:first-child button:nth-child(${buttonPosition})`,
                    buttonName,
                    timeout,
                    waitForStable
                );
                
                if (success2) return true;

                // Strategy 3: By button title attribute
                const buttonTitles = ['Configure Meet', 'Edit Meet', 'Delete Meet'];
                const expectedTitle = buttonTitles[buttonPosition - 1];
                
                const success3 = await this.tryClickStrategy(
                    `div[role="row"]:has-text("${rowIdentifier}") button[title="${expectedTitle}"]`,
                    buttonName,
                    timeout,
                    waitForStable
                );
                
                if (success3) return true;

                // Strategy 4: By icon class (Lucide icons)
                const iconClasses = ['lucide-settings', 'lucide-edit', 'lucide-trash-2'];
                const expectedIcon = iconClasses[buttonPosition - 1];
                
                const success4 = await this.tryClickStrategy(
                    `div[role="row"]:has-text("${rowIdentifier}") button:has(.${expectedIcon})`,
                    buttonName,
                    timeout,
                    waitForStable
                );
                
                if (success4) return true;

            } catch (error) {
                console.log(`Attempt ${attempt} failed: ${error.message}`);
                
                if (attempt < retries) {
                    // Wait before retry
                    await this.page.waitForTimeout(1000);
                    
                    // Try to refresh the grid
                    await this.refreshGrid();
                }
            }
        }

        throw new Error(`Failed to click ${buttonName} button after ${retries} attempts`);
    }

    /**
     * Try a specific click strategy
     */
    private async tryClickStrategy(
        selector: string,
        buttonName: string,
        timeout: number,
        waitForStable: boolean
    ): Promise<boolean> {
        try {
            console.log(`Trying selector: ${selector}`);
            
            // Wait for element to be visible
            await this.page.waitForSelector(selector, { 
                state: 'visible', 
                timeout: timeout / 2 
            });

            // Wait for element to be stable if requested
            if (waitForStable) {
                await this.page.waitForTimeout(500);
            }

            // Check if element is enabled
            const isEnabled = await this.page.isEnabled(selector);
            if (!isEnabled) {
                console.log(`Button is disabled: ${selector}`);
                return false;
            }

            // Scroll element into view if needed
            await this.page.locator(selector).scrollIntoViewIfNeeded();

            // Click the element
            await this.page.click(selector, { timeout: timeout / 2 });
            
            console.log(`Successfully clicked ${buttonName} using selector: ${selector}`);
            return true;

        } catch (error) {
            console.log(`Strategy failed for ${buttonName}: ${error.message}`);
            return false;
        }
    }

    /**
     * Refresh the AG Grid to ensure latest data
     */
    private async refreshGrid(): Promise<void> {
        try {
            // Try to trigger a grid refresh by resizing
            await this.page.evaluate(() => {
                const gridElement = document.querySelector('.ag-root-wrapper');
                if (gridElement) {
                    // Trigger resize event
                    window.dispatchEvent(new Event('resize'));
                }
            });
            
            await this.page.waitForTimeout(1000);
        } catch (error) {
            console.log(`Grid refresh failed: ${error.message}`);
        }
    }

    /**
     * Click button in mobile card view
     */
    async clickCardButton(
        cardIdentifier: string,
        buttonType: 'configure' | 'edit' | 'delete',
        options: ButtonClickOptions = {}
    ): Promise<boolean> {
        const { timeout = 10000 } = options;
        
        const buttonTitles = {
            configure: 'Configure Meet',
            edit: 'Edit Meet',
            delete: 'Delete Meet'
        };

        const cardSelector = `div:has-text("${cardIdentifier}").bg-white`;
        const buttonSelector = `${cardSelector} button[title="${buttonTitles[buttonType]}"]`;

        try {
            await this.page.waitForSelector(buttonSelector, { 
                state: 'visible', 
                timeout 
            });
            
            await this.page.click(buttonSelector);
            console.log(`Successfully clicked ${buttonType} button in card view`);
            return true;

        } catch (error) {
            console.log(`Failed to click ${buttonType} button in card view: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify button click was successful by checking for expected result
     */
    async verifyClickResult(
        expectedSelector: string,
        timeout: number = 10000
    ): Promise<boolean> {
        try {
            await this.page.waitForSelector(expectedSelector, { timeout });
            return true;
        } catch (error) {
            console.log(`Click verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get all available buttons in a row for debugging
     */
    async debugRowButtons(rowIdentifier: string): Promise<void> {
        try {
            const rowSelector = `div[role="row"]:has-text("${rowIdentifier}")`;
            const row = this.page.locator(rowSelector);
            
            if (await row.isVisible()) {
                const buttons = await row.locator('button').all();
                console.log(`Found ${buttons.length} buttons in row: ${rowIdentifier}`);
                
                for (let i = 0; i < buttons.length; i++) {
                    const button = buttons[i];
                    const title = await button.getAttribute('title');
                    const classes = await button.getAttribute('class');
                    const text = await button.textContent();
                    
                    console.log(`Button ${i + 1}:`);
                    console.log(`  Title: ${title}`);
                    console.log(`  Classes: ${classes}`);
                    console.log(`  Text: ${text}`);
                }
            } else {
                console.log(`Row not found: ${rowIdentifier}`);
            }
        } catch (error) {
            console.log(`Debug failed: ${error.message}`);
        }
    }
}

// Usage example:
export async function createButtonLocator(page: Page): Promise<ReliableButtonLocator> {
    return new ReliableButtonLocator(page);
}