import { expect, test } from '@playwright/test';
import { syntheticScenario } from '../../src/domain/reasoning-experiment/synthetic-scenario';

test('recomputes live facts for real edits, positions, removal and import', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/editor');
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  const inspector = page.getByTestId('editor-fact-inspector');
  await inspector.getByText('Live Situation preview', { exact: true }).click();
  const pairs = inspector.getByTestId('observed-pairs');
  await expect(pairs).toContainText('Blue / Yellow: same tacks');
  await expect(inspector).toContainText('There is no previous keyframe.');
  await page.getByTestId('tack-input').selectOption('port');
  await expect(pairs).toContainText('Blue / Yellow: opposite tacks');
  await page.getByTestId('boat-x-input').fill('1');
  await expect(pairs).toContainText('3.471 hull lengths apart');
  await page.getByTestId('keyframe-tab-position-2').click();
  await expect(inspector).toHaveAttribute('data-keyframe-id', 'position-2');
  await expect(pairs).toContainText('Blue / Yellow: same tacks');
  await expect(inspector.getByTestId('displacement-rate-blue')).toHaveText(
    'Time-dependent rate unresolved: no incident duration supplied.',
  );
  await page.getByTestId('remove-boat').click();
  await expect(pairs.getByRole('listitem')).toHaveCount(0);
  await expect(inspector.getByTestId('editor-fact-context')).toContainText(
    'Boats: 1 · Pairs: 0',
  );
  await expect(inspector).not.toContainText('Blue:');
  const imported = syntheticScenario();
  await page
    .getByTestId('import-scenario-json-input')
    .fill(JSON.stringify(imported));
  await page.getByTestId('import-scenario-json').click();
  await expect(page.getByTestId('import-json-status')).toHaveText(
    'Scenario JSON imported.',
  );
  await expect(inspector).toHaveAttribute('data-keyframe-id', 'before');
  await expect(pairs).toContainText('opposite tacks');
  await expect(inspector).not.toContainText('Yellow:');
  await page.getByTestId('keyframe-tab-middle').click();
  await expect(inspector.getByTestId('displacement-rate-s')).toContainText(
    'no incident duration supplied',
  );
  await page.getByTestId('delete-keyframe').click();
  await expect(inspector).not.toHaveAttribute('data-keyframe-id', 'middle');
  await expect(
    inspector.getByRole('region', { name: 'Unresolved analysis' }),
  ).toContainText('rulings have not been derived');
  await inspector.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
