import { expect, test } from '@playwright/test';

test('distinguishes geometric observations, timing assumptions and ruling gaps', async ({
  page,
}) => {
  await page.goto('/experiments/reasoning');
  await page
    .getByRole('link', { name: 'Which facts can geometry supply?' })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Which facts can Scenario supply?',
  );
  await expect(page.getByTestId('observed-pairs')).toContainText(
    '3.162 hull lengths',
  );
  await expect(page.getByTestId('displacement-rate-s')).toContainText(
    'unresolved',
  );
  await expect(page.getByTestId('derived-keep-clear-duty')).toContainText(
    'Unresolved',
  );
  await page
    .getByRole('combobox', { name: 'Experimental timing' })
    .selectOption('1');
  await expect(page.getByTestId('displacement-rate-s')).toContainText(
    '1.414 hull lengths/s',
  );
  await page
    .getByRole('combobox', { name: 'Experimental timing' })
    .selectOption('4');
  await expect(page.getByTestId('displacement-rate-s')).toContainText(
    '0.354 hull lengths/s',
  );
  await expect(page.getByTestId('observed-pairs')).toContainText(
    '3.162 hull lengths',
  );
  await page.getByRole('checkbox').check();
  await expect(page.getByTestId('derived-keep-clear-duty')).toContainText(
    'Conditional on the applicability assumption',
  );
  await expect(page.getByTestId('derived-room-compliance')).toContainText(
    'Unresolved',
  );
  await page
    .getByRole('combobox', { name: 'Experimental timing' })
    .selectOption('none');
  await expect(page.getByTestId('displacement-rate-s')).toContainText(
    'no incident duration',
  );
  await page
    .getByRole('combobox', { name: 'Keyframe', exact: true })
    .selectOption('before');
  await expect(page.getByText('There is no previous keyframe.')).toBeVisible();
  await page.getByRole('checkbox').uncheck();
  await expect(page.getByTestId('derived-keep-clear-duty')).toContainText(
    'Unresolved',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
