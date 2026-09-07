import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Scenario } from '../../src/domain/scenario/schema';

async function readScenario(page: Page): Promise<Scenario> {
  return JSON.parse(
    (await page.getByTestId('editor-scenario-json').textContent())!,
  );
}

test('adds and removes marks through draft, export and zero-mark states', async ({
  page,
}) => {
  await page.goto('/editor');
  const before = await readScenario(page);
  await page.getByTestId('add-mark').click();
  const added = await readScenario(page);
  const mark = added.courseFeatures.find(
    (feature) => !before.courseFeatures.some((old) => old.id === feature.id),
  );
  if (!mark || mark.type !== 'mark') throw new Error('Expected added mark');
  expect(mark.position.x).toBeGreaterThanOrEqual(0);
  expect(mark.position.x).toBeLessThanOrEqual(added.sailingArea.width);
  expect(mark.position.y).toBeGreaterThanOrEqual(0);
  expect(mark.position.y).toBeLessThanOrEqual(added.sailingArea.height);
  expect(mark.radius).toBeGreaterThan(0);
  expect(mark.requiredSide).toBeUndefined();
  expect(added.keyframes).toEqual(before.keyframes);
  expect(added.boats).toEqual(before.boats);
  await expect(page.getByTestId(`editor-mark-${mark.id}`)).toBeVisible();
  await expect(page.getByTestId(`editor-zone-${mark.id}`)).toHaveAttribute(
    'data-center-x',
    String(mark.position.x),
  );
  await expect(page.getByTestId(`editor-zone-${mark.id}`)).toHaveAttribute(
    'data-center-y',
    String(mark.position.y),
  );
  await page.getByTestId(`mark-label-input-${mark.id}`).fill('Gate exit');
  const edited = await readScenario(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('download-scenario-json').click();
  const download = await downloadPromise;
  expect(JSON.parse(await readFile((await download.path())!, 'utf8'))).toEqual(
    edited,
  );
  await page.reload();
  await expect(page.getByTestId(`mark-label-input-${mark.id}`)).toHaveValue(
    'Gate exit',
  );
  await page.getByTestId('remove-mark-leeward-mark').click();
  await expect(page.getByTestId('editor-mark-leeward-mark')).toHaveCount(0);
  await expect(page.getByTestId('editor-zone-leeward-mark')).toHaveCount(0);
  expect((await readScenario(page)).courseFeatures).toEqual(
    edited.courseFeatures.filter((feature) => feature.id !== 'leeward-mark'),
  );
  await page.getByTestId(`remove-mark-${mark.id}`).click();
  expect((await readScenario(page)).courseFeatures).toEqual([]);
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await page.getByTestId('add-mark').click();
  expect((await readScenario(page)).courseFeatures).toHaveLength(1);
  await page.getByTestId('reset-editor-draft').click();
  expect((await readScenario(page)).courseFeatures).toEqual(
    before.courseFeatures,
  );
});

test('avoids course-feature ID collisions and retains detached layline geometry', async ({
  page,
}) => {
  await page.goto('/editor');
  const scenario = await readScenario(page);
  scenario.courseFeatures.push(
    { type: 'line', id: 'mark-1', start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
    {
      type: 'layline',
      id: 'linked-layline',
      markId: 'leeward-mark',
      start: { x: 2, y: 1 },
      end: { x: 4, y: 2 },
    },
  );
  await page
    .getByTestId('import-scenario-json-input')
    .fill(JSON.stringify(scenario));
  await page.getByTestId('import-scenario-json').click();
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await page.getByTestId('add-mark').click();
  await page.getByTestId('add-mark').click();
  const added = await readScenario(page);
  const ids = added.courseFeatures.map((feature) => feature.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(
    added.courseFeatures.filter((feature) => feature.type === 'mark'),
  ).toHaveLength(3);
  await page.getByTestId('remove-mark-leeward-mark').click();
  const removed = await readScenario(page);
  expect(
    removed.courseFeatures.find((feature) => feature.id === 'linked-layline'),
  ).toEqual({
    type: 'layline',
    id: 'linked-layline',
    start: { x: 2, y: 1 },
    end: { x: 4, y: 2 },
  });
  expect(
    removed.courseFeatures.find((feature) => feature.id === 'mark-1'),
  ).toEqual(scenario.courseFeatures[1]);
  expect(removed.keyframes).toEqual(scenario.keyframes);
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await page.reload();
  await expect.poll(() => readScenario(page)).toEqual(removed);
});
