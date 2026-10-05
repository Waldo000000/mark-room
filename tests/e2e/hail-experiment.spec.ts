import { expect, test } from '@playwright/test';

test('keeps a linked hail conditional and does not guess who heard it', async ({
  page,
}) => {
  await page.goto('/experiments/reasoning');
  await page.getByRole('link', { name: 'Linked room-to-tack hails' }).click();
  const panel = page.getByRole('region', { name: 'Linked hail challenge' });
  const status = (id: string) =>
    panel.getByTestId(`hail-${id}`).getByTestId('hail-status');
  await expect(status('middle-relay')).toHaveText(
    'Conditional: depends on W’s current response',
  );
  const select = panel.getByRole('combobox');
  await select.selectOption('hearing');
  await expect(status('windward-response')).toHaveText('Unresolved');
  await expect(status('middle-response')).toHaveText(
    'Supported by supplied premises',
  );
  await select.selectOption('responding');
  await expect(status('middle-relay')).toHaveText(
    'Additional relay not required by this branch',
  );
  await select.selectOption('waiting');
  await expect(status('middle-relay')).toHaveText(
    'Supported by supplied premises',
  );
  await select.selectOption('invalid');
  await expect(status('windward-response')).toHaveText(
    'Supported by supplied premises',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
