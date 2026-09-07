import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Scenario } from '../../src/domain/scenario/schema';

async function scenario(page: Page): Promise<Scenario> {
  return JSON.parse(
    (await page.getByTestId('editor-scenario-json').textContent()) ?? '',
  );
}

test('chooses downwind tack for one boat and position and persists sail semantics', async ({
  page,
}) => {
  await page.goto('/editor');
  const before = await scenario(page);
  const input = page.getByTestId('tack-input');
  await expect(input).toBeEnabled();
  await expect(input).toHaveValue('starboard');
  await input.selectOption('port');
  const after = await scenario(page);
  const expected = structuredClone(before);
  expected.keyframes[0].boatStates[0].tack = 'port';
  expect(after).toEqual(expected);
  await expect(page.getByTestId('heading-alignment-status')).toHaveAttribute(
    'data-alignment-enabled',
    'true',
  );
  const glyph = page.getByTestId('editor-boat-blue').getByTestId('boat-glyph');
  await expect(glyph).toHaveAttribute('data-sail-side', 'starboard');
  await expect(glyph).toHaveAttribute('data-trim-degrees', '75');
  await expect(glyph).toHaveAttribute('data-luffing', 'false');
  await expect(glyph).toHaveAttribute('data-hull-length', '1');
  await expect(page.getByTestId('heading-input')).toHaveValue('180');
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await page.screenshot({
    path: test.info().outputPath('chosen-downwind-tack.png'),
    fullPage: true,
  });
  await page.getByTestId('keyframe-tab-position-2').click();
  await expect(input).toHaveValue('starboard');
  await page.getByTestId('keyframe-tab-position-1').click();
  await expect(input).toHaveValue('port');
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('download-scenario-json').click();
  const download = await downloadPromise;
  expect(JSON.parse(await readFile((await download.path())!, 'utf8'))).toEqual(
    after,
  );
  await page.reload();
  await expect(input).toHaveValue('port');
  expect(await scenario(page)).toEqual(after);
});

test('keeps inference authoritative away from ambiguous headings as wind changes', async ({
  page,
}) => {
  await page.goto('/editor');
  const input = page.getByTestId('tack-input');
  await input.selectOption('port');
  await page.getByTestId('heading-input').fill('225');
  await expect(input).toBeDisabled();
  await expect(input).toHaveValue('starboard');
  await page.getByTestId('heading-input').fill('180');
  await expect(input).toBeEnabled();
  await expect(input).toHaveValue('starboard');
  await page.getByTestId('wind-direction-input').fill('45');
  await expect(input).toBeDisabled();
  await expect(input).toHaveValue('port');
  await page.getByTestId('heading-input').fill('45');
  await expect(input).toBeEnabled();
  await input.selectOption('starboard');
  const glyph = page.getByTestId('editor-boat-blue').getByTestId('boat-glyph');
  await expect(glyph).toHaveAttribute('data-luffing', 'true');
  await expect(glyph).toHaveAttribute('data-sail-side', 'port');
  await expect(glyph).toHaveAttribute('data-trim-degrees', '0');
  await expect(page.getByTestId('heading-alignment-status')).toHaveAttribute(
    'data-alignment-enabled',
    'false',
  );
  await page.screenshot({
    path: test.info().outputPath('chosen-head-to-wind-tack.png'),
    fullPage: true,
  });
  await page.getByTestId('heading-input').fill('225');
  await expect(input).toBeEnabled();
  await expect(input).toHaveValue('starboard');
  await input.selectOption('port');
  await expect(glyph).toHaveAttribute('data-luffing', 'false');
  await expect(glyph).toHaveAttribute('data-trim-degrees', '75');
  await expect(glyph).toHaveAttribute('data-sail-side', 'starboard');
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
});
