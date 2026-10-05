import { expect, test } from '@playwright/test';

test('inspects supplied assessments and missing/conflicting inference dependencies', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page
    .getByRole('link', {
      name: 'Research prototype: inspect facts and rulings',
    })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'From sailing facts to a ruling',
  );
  const exoneration = page.getByTestId('finding-exoneration');
  const breach = page.getByTestId('finding-keep-clear-breach');
  const compliance = page.getByTestId('finding-room-compliance');
  await expect(exoneration.getByTestId('finding-status')).toHaveText(
    'Supported by supplied premises',
  );
  await expect(breach.getByTestId('finding-status')).toHaveText(
    'Supported by supplied premises',
  );
  await expect(compliance.getByTestId('finding-status')).toHaveText(
    'Supported by supplied premises',
  );
  await exoneration.getByText('Why this conclusion?', { exact: true }).click();
  await expect(exoneration).toContainText(
    'Depends on source-supplied assessments',
  );
  await exoneration
    .getByRole('link', {
      name: 'The port boat is sailing within her entitled room',
    })
    .click();
  await expect(page).toHaveURL(/#fact-within-entitlement$/);
  await page.locator('#fact-within-entitlement summary').click();
  await expect(page.locator('#fact-within-entitlement')).toContainText(
    'Source-supplied assessment',
  );
  await page
    .getByRole('combobox', { name: 'Evidence check' })
    .selectOption('missing');
  await expect(exoneration.getByTestId('finding-status')).toHaveText(
    'Unresolved',
  );
  await expect(breach.getByTestId('finding-status')).toHaveText(
    'Supported by supplied premises',
  );
  await expect(compliance.getByTestId('finding-status')).toHaveText(
    'Supported by supplied premises',
  );
  await page
    .getByRole('combobox', { name: 'Evidence check' })
    .selectOption('conflict');
  await expect(page.getByRole('status')).toContainText(
    'conflicting supplied values',
  );
  await expect(exoneration.getByTestId('finding-status')).toHaveText(
    'Unresolved',
  );
  await page
    .getByRole('combobox', { name: 'Evidence check' })
    .selectOption('source');
  await expect(exoneration.getByTestId('finding-status')).toHaveText(
    'Supported by supplied premises',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
