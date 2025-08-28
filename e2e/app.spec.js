const { test, expect, _electron } = require('@playwright/test');

test('App launches and displays main heading', async () => {
  const electronApp = await _electron.launch({ args: ['electron.js'] });
  const window = await electronApp.firstWindow();
  
  await expect(window).toHaveTitle('🌡️ VibeCheck');
  
  const heading = window.locator('h1 > p:has-text("Vibe")');
  await expect(heading).toBeVisible();
  
  await electronApp.close();
});

test('Switching between Batch and Versus mode works', async () => {
  const electronApp = await _electron.launch({ args: ['electron.js'] });
  const window = await electronApp.firstWindow();

  const batchButton = window.locator('button', { hasText: 'Batch' });
  const versusButton = window.locator('button', { hasText: 'Versus' });

  // Initial state: Batch mode is active
  await expect(batchButton).toHaveClass(/primary/);
  await expect(versusButton).not.toHaveClass(/primary/);

  // Switch to Versus mode
  await versusButton.click();
  await expect(versusButton).toHaveClass(/primary/);
  await expect(batchButton).not.toHaveClass(/primary/);

  // Switch back to Batch mode
  await batchButton.click();
  await expect(batchButton).toHaveClass(/primary/);
  await expect(versusButton).not.toHaveClass(/primary/);

  await electronApp.close();
});

test('Intro screen shows presets and clicking one starts a round', async () => {
  const electronApp = await _electron.launch({ args: ['electron.js'] });
  const window = await electronApp.firstWindow();

  // Wait for intro to be visible
  await expect(window.locator('h2:has-text("Welcome to VibeCheck")')).toBeVisible();

  // Find a preset and click it
  const presetButton = window.locator('.presets .chip').first();
  const presetLabel = await presetButton.textContent();
  await presetButton.click();

  // Wait for the feed to appear and the intro to disappear
  await expect(window.locator('.intro')).not.toBeVisible();
  await expect(window.locator('.feed')).toBeVisible();

  // Check that the prompt in the feed matches the preset clicked
  await expect(window.locator('.feed .prompt p').first()).toHaveText(presetLabel);
  
  // Check for the loading state
  await expect(window.locator('.loader').first()).toBeVisible();

  await electronApp.close();
});
