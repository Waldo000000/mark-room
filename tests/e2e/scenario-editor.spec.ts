import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

import type { Scenario } from '../../src/domain/scenario/schema';

const EDITOR_DRAFT_STORAGE_KEY = 'mark-room.editor.scenario-draft.v1';

function parseScenarioJson(text: string | null): Scenario {
  return JSON.parse(text ?? '') as Scenario;
}

test('edits scenario geometry across keyframes', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await page.goto('/');
  await page.getByRole('link', { name: 'Open editor' }).click();

  await expect(page).toHaveURL('/editor');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Edit scenario geometry' }),
  ).toBeVisible();
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-1',
  );
  await expect(page.getByTestId('ghosted-keyframe-context')).toHaveAttribute(
    'data-labels',
    'hidden',
  );
  await expect(page.getByTestId('ghost-boat-position-2-blue')).toBeVisible();
  await expect(page.getByTestId('ghost-boat-position-2-blue')).toHaveAttribute(
    'opacity',
    '0.28',
  );

  await page.getByTestId('add-keyframe').click();

  await expect(page.getByTestId('keyframe-tab-position-3')).toHaveAttribute(
    'aria-current',
    'step',
  );
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-3',
  );
  await expect(page.getByTestId('ghost-boat-position-1-blue')).toBeVisible();
  await expect(page.getByTestId('ghost-boat-position-2-blue')).toBeVisible();

  await page.getByRole('button', { name: 'Yellow' }).click();
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-selected-boat-id',
    'yellow',
  );
  const diagramSvg = page.getByTestId('editor-diagram').locator('svg');
  const diagramSvgBox = await diagramSvg.boundingBox();
  if (!diagramSvgBox) {
    throw new Error('Expected editor SVG bounds');
  }

  await diagramSvg.click({
    position: {
      x: diagramSvgBox.width * 0.25,
      y: diagramSvgBox.height * 0.25,
    },
  });

  const tappedScenario = parseScenarioJson(
    await page.getByTestId('editor-scenario-json').textContent(),
  );
  const tappedYellow = tappedScenario.keyframes[2].boatStates.find(
    (state) => state.boatId === 'yellow',
  );

  expect(tappedYellow?.position.x).toBeGreaterThan(1.5);
  expect(tappedYellow?.position.x).toBeLessThan(2.5);
  expect(tappedYellow?.position.y).toBeGreaterThan(5.5);
  expect(tappedYellow?.position.y).toBeLessThan(6.5);

  await page.getByTestId('boat-x-input').fill('5.2');
  await page.getByTestId('boat-y-input').fill('3.4');
  await page.getByTestId('heading-input').fill('135');

  const scenario = parseScenarioJson(
    await page.getByTestId('editor-scenario-json').textContent(),
  );
  const thirdKeyframe = scenario.keyframes.find(
    (keyframe) => keyframe.id === 'position-3',
  );
  const secondKeyframe = scenario.keyframes.find(
    (keyframe) => keyframe.id === 'position-2',
  );
  const yellow = thirdKeyframe?.boatStates.find(
    (state) => state.boatId === 'yellow',
  );

  expect(scenario.keyframes).toHaveLength(3);
  expect(thirdKeyframe?.label).toBe('Position 3');
  expect(secondKeyframe?.boatStates).toContainEqual(
    expect.objectContaining({
      boatId: 'yellow',
      position: { x: 4.3, y: 4.9 },
    }),
  );
  expect(yellow).toMatchObject({
    boatId: 'yellow',
    position: { x: 5.2, y: 3.4 },
    headingDegrees: 135,
    tack: 'port',
  });

  const renderedYellow = page.getByTestId('editor-boat-yellow');
  await expect(renderedYellow.locator(':scope > g').first()).toHaveAttribute(
    'transform',
    'translate(5.2 4.6) rotate(135)',
  );

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByTestId('copy-scenario-json').click();
  await expect(page.getByTestId('copy-json-status')).toHaveText(
    'Scenario JSON copied.',
  );
  const copiedScenario = parseScenarioJson(
    await page.evaluate(() => navigator.clipboard.readText()),
  );
  expect(copiedScenario).toEqual(scenario);

  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('download-scenario-json').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`${scenario.id}.json`);
  const downloadedPath = await download.path();
  expect(downloadedPath).toBeTruthy();
  const downloadedScenario = parseScenarioJson(
    await readFile(downloadedPath ?? '', 'utf8'),
  );
  expect(downloadedScenario).toEqual(scenario);

  await expect
    .poll(() =>
      page.evaluate((storageKey) => {
        const savedDraft = window.localStorage.getItem(storageKey);
        return savedDraft ? JSON.parse(savedDraft).scenario : null;
      }, EDITOR_DRAFT_STORAGE_KEY),
    )
    .toEqual(scenario);

  await page.reload();

  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-3',
  );
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-selected-boat-id',
    'yellow',
  );
  const restoredScenario = parseScenarioJson(
    await page.getByTestId('editor-scenario-json').textContent(),
  );
  expect(restoredScenario).toEqual(scenario);

  await page.getByTestId('reset-editor-draft').click();

  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-1',
  );
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-selected-boat-id',
    'blue',
  );
  const resetScenario = parseScenarioJson(
    await page.getByTestId('editor-scenario-json').textContent(),
  );
  expect(resetScenario.id).toBe('editor-spike-draft');
  expect(resetScenario.keyframes).toHaveLength(2);
  await expect
    .poll(() =>
      page.evaluate(
        (storageKey) => window.localStorage.getItem(storageKey),
        EDITOR_DRAFT_STORAGE_KEY,
      ),
    )
    .toBeNull();

  await expect(page.locator('html')).toHaveJSProperty(
    'scrollWidth',
    await page.locator('html').evaluate((element) => element.clientWidth),
  );
  expect(runtimeErrors).toEqual([]);
});

test('ignores invalid saved editor drafts', async ({ page }) => {
  await page.addInitScript((storageKey) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        activeKeyframeId: 'missing-position',
        scenario: { id: 'invalid-draft' },
        selectedBoatId: 'missing-boat',
      }),
    );
  }, EDITOR_DRAFT_STORAGE_KEY);

  await page.goto('/editor');

  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-1',
  );
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-selected-boat-id',
    'blue',
  );
  const scenario = parseScenarioJson(
    await page.getByTestId('editor-scenario-json').textContent(),
  );
  expect(scenario.id).toBe('editor-spike-draft');
  expect(scenario.keyframes).toHaveLength(2);
});
