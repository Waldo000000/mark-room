import { expect, test } from '@playwright/test';

test('browses referenced rules and opens a matching example', async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await page.goto('/scenarios');
  await page.getByRole('link', { name: 'Explore referenced rules' }).click();

  await expect(page).toHaveURL('/rules');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Rules referenced by MarkRoom',
    }),
  ).toBeVisible();
  await expect(
    page.getByText('MarkRoom examples are not official interpretations.'),
  ).toBeVisible();

  const ruleTen = page.locator('[data-rule-reference="RRS 10"]');
  const ruleEleven = page.locator('[data-rule-reference="RRS 11"]');
  await expect(ruleTen).toContainText('1 example in the current corpus');
  await expect(ruleEleven).toContainText('3 examples in the current corpus');
  await expect(ruleEleven.getByText('Unverified transcription')).toHaveCount(3);
  await expect(
    ruleEleven.getByRole('link', { name: 'Open authoritative source' }),
  ).toHaveCount(3);
  await expect(
    ruleEleven.getByRole('link', { name: 'Windward meets leeward' }),
  ).toBeVisible();

  await ruleEleven
    .getByRole('link', { name: 'Windward meets leeward' })
    .click();

  await expect(page).toHaveURL('/scenarios/windward-leeward');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Windward meets leeward' }),
  ).toBeVisible();
  await expect(page.getByText('Unverified transcription')).toBeVisible();
  await expect(page.locator('html')).toHaveJSProperty(
    'scrollWidth',
    await page.locator('html').evaluate((element) => element.clientWidth),
  );
  expect(runtimeErrors).toEqual([]);
});
