import { expect, test } from '@playwright/test';

test('keeps current order fixed while mark-room history changes supported duties', async ({
  page,
}) => {
  await page.goto('/experiments/reasoning');
  await page.getByRole('link', { name: 'Held-out mark-room test' }).click();
  const panel = page.getByRole('region', {
    name: 'Mark-room history challenge',
  });
  await expect(panel.getByTestId('mark-room-findings')).toContainText(
    'A must give B mark-room',
  );
  await expect(panel.getByTestId('mark-room-dependencies')).toContainText(
    'A’s mark-room for B includes space for B to meet: give C mark-room.',
  );
  const select = panel.getByRole('combobox');
  await select.selectOption('missing');
  await expect(panel.getByTestId('mark-room-findings')).not.toContainText(
    'must give',
  );
  await expect(panel.getByTestId('mark-room-findings')).toContainText(
    'Entry relationship not supplied.',
  );
  await select.selectOption('reversed');
  await expect(panel.getByTestId('mark-room-findings')).toContainText(
    'B must give A mark-room',
  );
  await expect(panel).toContainText(
    'current outside-to-inside order A / B / C',
  );
  await select.selectOption('exception');
  await expect(panel.getByTestId('mark-room-findings')).not.toContainText(
    'must give',
  );
  await expect(panel.getByTestId('mark-room-findings')).toContainText(
    'outside this bounded branch',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

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
    .getByRole('combobox', { name: 'Evidence check', exact: true })
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
    .getByRole('combobox', { name: 'Evidence check', exact: true })
    .selectOption('conflict');
  await expect(page.getByRole('status')).toContainText(
    'conflicting supplied values',
  );
  await expect(exoneration.getByTestId('finding-status')).toHaveText(
    'Unresolved',
  );
  await page
    .getByRole('combobox', { name: 'Evidence check', exact: true })
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
