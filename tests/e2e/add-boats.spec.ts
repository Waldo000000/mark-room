import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Scenario } from '../../src/domain/scenario/schema';

async function scenario(page: Page): Promise<Scenario> {
  return JSON.parse(
    (await page.getByTestId('editor-scenario-json').textContent()) ?? '',
  );
}

test('adds an editable boat in every position while preserving the existing draft', async ({
  page,
}) => {
  await page.goto('/editor');
  await page
    .getByTestId('editor-position-selector')
    .getByRole('button', { name: 'Position 2', exact: true })
    .click();
  await page.getByTestId('heading-input').fill('135');
  const before = await scenario(page);
  const savedMetadata = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('mark-room.editor.scenario-draft.v1')!)
        .metadata,
  );
  if (test.info().project.name === 'phone')
    await page.getByTestId('add-boat').tap();
  else await page.getByTestId('add-boat').click();
  const added = await scenario(page);
  const newBoat = added.boats.find(
    (boat) => !before.boats.some((old) => old.id === boat.id),
  )!;
  expect(newBoat).toBeDefined();
  expect(added.boats).toHaveLength(before.boats.length + 1);
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-2',
  );
  await expect(page.getByTestId('boat-label-input')).toHaveValue(newBoat.label);
  await expect(page.getByTestId('heading-alignment-status')).toHaveAttribute(
    'data-alignment-enabled',
    'true',
  );
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('mark-room.editor.scenario-draft.v1')!)
          .metadata,
    ),
  ).toEqual(savedMetadata);
  for (const [index, keyframe] of added.keyframes.entries()) {
    expect(
      keyframe.boatStates.filter((state) => state.boatId !== newBoat.id),
    ).toEqual(before.keyframes[index].boatStates);
    const newState = keyframe.boatStates.find(
      (state) => state.boatId === newBoat.id,
    )!;
    expect(newState.headingDegrees).toBe(
      before.keyframes[index].boatStates[0].headingDegrees,
    );
    expect(newState.tack).toBe(before.keyframes[index].boatStates[0].tack);
    expect(newState.position.x).toBeGreaterThanOrEqual(0);
    expect(newState.position.x).toBeLessThanOrEqual(added.sailingArea.width);
    expect(newState.position.y).toBeGreaterThanOrEqual(0);
    expect(newState.position.y).toBeLessThanOrEqual(added.sailingArea.height);
  }
  expect(added.courseFeatures).toEqual(before.courseFeatures);
  expect(added.observedEvents).toEqual(before.observedEvents);
  await page.getByTestId('boat-label-input').fill('Green');
  await page.getByTestId('boat-color-input').fill('#16a34a');
  await page.getByTestId('boat-x-input').fill('6');
  await page.getByTestId('boat-y-input').fill('6');
  const previous = added.keyframes[0].boatStates.find(
    (state) => state.boatId === newBoat.id,
  )!.position;
  const expectedHeading =
    (Math.round((Math.atan2(6 - previous.x, 6 - previous.y) * 180) / Math.PI) +
      360) %
    360;
  await expect(page.getByTestId('heading-input')).toHaveValue(
    String(expectedHeading),
  );
  await page.getByTestId('heading-input').fill('90');
  const glyph = page
    .getByTestId(`editor-boat-${newBoat.id}`)
    .getByTestId('boat-glyph');
  await expect(glyph).toHaveAttribute('data-sail-side', 'starboard');
  await expect(glyph).toHaveAttribute('data-trim-degrees', '45');
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await page.screenshot({
    path: test.info().outputPath('added-boat.png'),
    fullPage: true,
  });
  const edited = await scenario(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('download-scenario-json').click();
  expect(
    JSON.parse(await readFile((await (await downloadPromise).path())!, 'utf8')),
  ).toEqual(edited);
  await page.reload();
  await expect(page.getByTestId('boat-label-input')).toHaveValue('Green');
  expect(await scenario(page)).toEqual(edited);
  await page
    .getByTestId('editor-position-selector')
    .getByRole('button', { name: 'Position 1', exact: true })
    .click();
  await expect(page.getByTestId(`editor-boat-${newBoat.id}`)).toBeVisible();
  await expect(page.getByTestId('boat-label-input')).toHaveValue('Green');
});

test('avoids imported boat ID collisions across repeated additions and preserves valid tiny bounds', async ({
  page,
}) => {
  await page.goto('/editor');
  const imported = await scenario(page);
  imported.boats[0].id = 'boat-1';
  imported.boats[1].id = 'boat-3';
  for (const keyframe of imported.keyframes) {
    keyframe.boatStates[0].boatId = 'boat-1';
    keyframe.boatStates[1].boatId = 'boat-3';
  }
  imported.sailingArea = { width: 0.03, height: 0.02 };
  imported.courseFeatures = [];
  for (const keyframe of imported.keyframes)
    for (const state of keyframe.boatStates)
      state.position = { x: 0.01, y: 0.01 };
  await page
    .getByTestId('import-scenario-json-input')
    .fill(JSON.stringify(imported));
  await page.getByTestId('import-scenario-json').click();
  await page.getByTestId('add-boat').click();
  await page.getByTestId('add-boat').click();
  const added = await scenario(page);
  expect(added.boats.map((boat) => boat.id)).toEqual([
    'boat-1',
    'boat-3',
    'boat-2',
    'boat-4',
  ]);
  for (const keyframe of added.keyframes) {
    expect(keyframe.boatStates).toHaveLength(4);
    expect(new Set(keyframe.boatStates.map((state) => state.boatId)).size).toBe(
      4,
    );
    for (const state of keyframe.boatStates) {
      expect(state.position.x).toBeGreaterThanOrEqual(0);
      expect(state.position.x).toBeLessThanOrEqual(0.03);
      expect(state.position.y).toBeGreaterThanOrEqual(0);
      expect(state.position.y).toBeLessThanOrEqual(0.02);
    }
  }
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await page.reload();
  await expect.poll(async () => (await scenario(page)).boats.length).toBe(4);
});
