import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Scenario } from '../../src/domain/scenario/schema';

async function scenario(page: Page): Promise<Scenario> {
  return JSON.parse(
    (await page.getByTestId('editor-scenario-json').textContent()) ?? '',
  );
}

test('keeps positions independently selectable after deleting a middle position and adding again', async ({
  page,
}) => {
  await page.goto('/editor');
  await page.getByTestId('add-keyframe').click();
  const before = await scenario(page);
  const picker = page.getByTestId('editor-position-selector');
  await picker.getByRole('button', { name: 'Position 2', exact: true }).click();
  await page.getByTestId('delete-keyframe').click();
  await page.getByTestId('add-keyframe').click();
  const added = await scenario(page);
  expect(new Set(added.keyframes.map((frame) => frame.id)).size).toBe(3);
  expect(added.keyframes.slice(0, 2)).toEqual([
    before.keyframes[0],
    before.keyframes[2],
  ]);
  expect(added.keyframes[2].id).toBe('position-2');
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  for (const frame of added.keyframes) {
    await picker
      .getByRole('button', { name: frame.label!, exact: true })
      .click();
    await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
      'data-active-keyframe-id',
      frame.id,
    );
  }
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('download-scenario-json').click();
  const download = await downloadPromise;
  expect(JSON.parse(await readFile((await download.path())!, 'utf8'))).toEqual(
    added,
  );
  await page.reload();
  await expect.poll(() => scenario(page)).toEqual(added);
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
});

test('allocates unused identities for imported sparse and custom keyframes', async ({
  page,
}) => {
  await page.goto('/editor');
  const imported = await scenario(page);
  imported.keyframes[0].id = 'position-3';
  imported.keyframes[0].label = 'Imported start';
  imported.keyframes[1].id = 'custom-finish';
  imported.keyframes[1].label = 'Imported finish';
  await page
    .getByTestId('import-scenario-json-input')
    .fill(JSON.stringify(imported));
  await page.getByTestId('import-scenario-json').click();
  for (const expectedId of ['position-1', 'position-2', 'position-4']) {
    await page.getByTestId('add-keyframe').click();
    await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
      'data-active-keyframe-id',
      expectedId,
    );
    await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
      'data-valid',
      'true',
    );
  }
  const added = await scenario(page);
  expect(added.keyframes.slice(0, 2)).toEqual(imported.keyframes);
  expect(new Set(added.keyframes.map((frame) => frame.id)).size).toBe(5);
});
