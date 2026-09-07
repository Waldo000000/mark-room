import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('edits mark details and preserves them through export, reload and import', async ({
  page,
}) => {
  await page.goto('/editor');
  const json = page.getByTestId('editor-scenario-json');
  const before = JSON.parse((await json.textContent())!);
  const label = page.getByTestId('mark-label-input-leeward-mark');
  const radius = page.getByTestId('mark-radius-input-leeward-mark');
  const side = page.getByTestId('mark-required-side-input-leeward-mark');
  await label.fill('Gate buoy');
  await radius.fill('0.35');
  await side.selectOption('starboard');
  const mark = page.getByTestId('editor-mark-leeward-mark');
  await expect(mark).toContainText('Gate buoy (leave to starboard)');
  await expect(mark.locator('circle').first()).toHaveAttribute('r', '0.35');
  await expect(page.getByTestId('editor-zone-leeward-mark')).toHaveAttribute(
    'data-radius-hull-lengths',
    '4',
  );
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  const after = JSON.parse((await json.textContent())!);
  expect(after.courseFeatures[0]).toEqual({
    ...before.courseFeatures[0],
    label: 'Gate buoy',
    radius: 0.35,
    requiredSide: 'starboard',
  });
  expect(after.keyframes).toEqual(before.keyframes);
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('download-scenario-json').click();
  const download = await downloadPromise;
  expect(JSON.parse(await readFile((await download.path())!, 'utf8'))).toEqual(
    after,
  );
  await page.reload();
  await expect(label).toHaveValue('Gate buoy');
  await expect(radius).toHaveValue('0.35');
  await expect(side).toHaveValue('starboard');
  await page.getByTestId('reset-editor-draft').click();
  await expect(label).toHaveValue('Leeward mark');
  await expect(side).toHaveValue('port');
  await page
    .getByTestId('import-scenario-json-input')
    .fill(JSON.stringify(after));
  await page.getByTestId('import-scenario-json').click();
  await expect(label).toHaveValue('Gate buoy');
  await expect(radius).toHaveValue('0.35');
  await expect(side).toHaveValue('starboard');
  expect(JSON.parse((await json.textContent())!)).toEqual(after);
});

test('keeps radius positive and allows optional mark details to be cleared', async ({
  page,
}) => {
  await page.goto('/editor');
  const radius = page.getByTestId('mark-radius-input-leeward-mark');
  await radius.fill('0.005');
  await expect(radius).toHaveValue('0.005');
  expect(
    await radius.evaluate(
      (input) => (input as HTMLInputElement).validity.valid,
    ),
  ).toBe(true);
  await radius.fill('0.4');
  for (const invalid of ['0', '-1', '']) {
    await radius.fill(invalid);
    await radius.blur();
    await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
      'data-valid',
      'true',
    );
    const value = JSON.parse(
      (await page.getByTestId('editor-scenario-json').textContent())!,
    ).courseFeatures[0].radius;
    expect(value).toBeGreaterThan(0);
  }
  await page.getByTestId('mark-label-input-leeward-mark').fill('');
  await page
    .getByTestId('mark-required-side-input-leeward-mark')
    .selectOption('');
  const mark = JSON.parse(
    (await page.getByTestId('editor-scenario-json').textContent())!,
  ).courseFeatures[0];
  expect(mark.id).toBe('leeward-mark');
  expect(mark).not.toHaveProperty('label');
  expect(mark).not.toHaveProperty('requiredSide');
  await expect(page.getByTestId('editor-mark-leeward-mark')).toContainText(
    'leeward-mark',
  );
  await expect(page.getByTestId('editor-mark-leeward-mark')).not.toContainText(
    'leave to',
  );
});
