import { expect, test } from '@playwright/test';

test('filters and clears scenarios by rule reference', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await page.goto('/scenarios');
  await expect(page.getByTestId('scenario-count')).toHaveText('3 scenarios');

  await page.getByLabel('Filter by rule').selectOption('RRS 11');
  await page.getByRole('button', { name: 'Apply filter' }).click();

  await expect(page).toHaveURL('/scenarios?rule=RRS+11');
  await expect(page.getByTestId('scenario-count')).toHaveText(
    '2 scenarios citing RRS 11',
  );
  await expect(
    page.getByRole('heading', { level: 2, name: 'Windward meets leeward' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Overlapped boats near a mark',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Port meets starboard' }),
  ).toHaveCount(0);
  await expect(page.getByText('Unverified transcription')).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Open scenario' })).toHaveCount(
    2,
  );

  await page.getByRole('link', { name: 'Clear filter' }).click();

  await expect(page).toHaveURL('/scenarios');
  await expect(page.getByTestId('scenario-count')).toHaveText('3 scenarios');
  await expect(page.getByLabel('Filter by rule')).toHaveValue('');
  await expect(page.locator('html')).toHaveJSProperty(
    'scrollWidth',
    await page.locator('html').evaluate((element) => element.clientWidth),
  );
  expect(runtimeErrors).toEqual([]);
});
