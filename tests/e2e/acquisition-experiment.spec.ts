import { expect, test } from '@playwright/test';

test('separates acquired right of way, course change and missing response evidence', async ({
  page,
}) => {
  await page.goto('/experiments/reasoning');
  await page.getByRole('link', { name: 'Acquiring right of way' }).click();
  const panel = page.getByRole('region', {
    name: 'Acquired right of way challenge',
  });
  const status = (id: string) =>
    panel.getByTestId(`acquisition-${id}`).getByTestId('acquisition-status');
  await expect(status('breach-15')).toHaveText(
    'Supported by supplied premises',
  );
  await expect(status('breach-11')).toHaveText(
    'Supported by supplied premises',
  );
  await expect(status('exoneration')).toHaveText(
    'Supported by supplied premises',
  );
  const select = panel.getByRole('combobox');
  await select.selectOption('history');
  await expect(status('room-15')).toHaveText('Unresolved');
  await expect(status('room-16')).toHaveText('Supported by supplied premises');
  await select.selectOption('other');
  await expect(status('room-15')).toHaveText('Not supported by these premises');
  await expect(status('room-16')).toHaveText('Supported by supplied premises');
  await select.selectOption('response');
  await expect(status('breach-15')).toHaveText('Unresolved');
  await expect(status('breach-16')).toHaveText('Unresolved');
  await expect(status('room-15')).toHaveText('Supported by supplied premises');
  await panel
    .getByText('Supplied evidence and its basis', { exact: true })
    .click();
  await expect(panel).toContainText('Not supplied in this diagnostic.');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
