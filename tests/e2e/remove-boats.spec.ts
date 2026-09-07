import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Scenario } from '../../src/domain/scenario/schema';

async function scenario(page: Page): Promise<Scenario> {
  return JSON.parse(
    (await page.getByTestId('editor-scenario-json').textContent()) ?? '',
  );
}

async function pick(page: Page, name: string) {
  await page
    .getByTestId('boat-picker')
    .getByRole('button', { name, exact: true })
    .click();
}

test('removes only the selected boat and its references, preserves drafts, and protects the last boat', async ({
  page,
}) => {
  await page.goto('/editor');
  const imported = await scenario(page);
  imported.observedEvents = [
    {
      id: 'blue-hail',
      type: 'hail',
      atKeyframe: 'position-1',
      boatId: 'blue',
      message: 'Protest',
    },
    {
      id: 'blue-penalty',
      type: 'penalty-taken',
      atKeyframe: 'position-2',
      boatId: 'blue',
      penaltyType: 'one-turn',
    },
    {
      id: 'yellow-hail',
      type: 'hail',
      atKeyframe: 'position-1',
      boatId: 'yellow',
      message: 'Room',
    },
  ];
  await page
    .getByTestId('import-scenario-json-input')
    .fill(JSON.stringify(imported));
  await page.getByTestId('import-scenario-json').click();
  await page.getByTestId('add-boat').click();
  await pick(page, 'Yellow');
  await page.getByTestId('heading-input').fill('270');
  await pick(page, 'Blue');
  await page.getByTestId('heading-input').fill('135');
  await page
    .getByTestId('editor-position-selector')
    .getByRole('button', { name: 'Position 2', exact: true })
    .click();
  const before = await scenario(page);
  await expect(page.getByTestId('remove-boat-description')).toContainText(
    /2.*event/i,
  );
  await page.screenshot({
    path: test.info().outputPath('remove-boat-events.png'),
    fullPage: true,
  });
  if (test.info().project.name === 'phone')
    await page.getByTestId('remove-boat').tap();
  else await page.getByTestId('remove-boat').click();
  const after = await scenario(page);
  expect(after.boats).toEqual(
    before.boats.filter((boat) => boat.id !== 'blue'),
  );
  expect(after.keyframes).toEqual(
    before.keyframes.map((frame) => ({
      ...frame,
      boatStates: frame.boatStates.filter((state) => state.boatId !== 'blue'),
    })),
  );
  expect(after.observedEvents).toEqual(
    before.observedEvents.filter((event) => event.boatId !== 'blue'),
  );
  expect(after.courseFeatures).toEqual(before.courseFeatures);
  await expect(page.getByTestId('boat-label-input')).toHaveValue('Yellow');
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-2',
  );
  const metadata = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('mark-room.editor.scenario-draft.v1')!)
        .metadata,
  );
  expect(metadata.disabledHeadingAlignmentPairs).toEqual([
    { boatId: 'yellow', keyframeId: 'position-1' },
  ]);
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('download-scenario-json').click();
  expect(
    JSON.parse(await readFile((await (await downloadPromise).path())!, 'utf8')),
  ).toEqual(after);
  await page.reload();
  await expect(page.getByTestId('boat-label-input')).toHaveValue('Yellow');
  expect(await scenario(page)).toEqual(after);
  await page.getByTestId('remove-boat').click();
  await expect(page.getByTestId('boat-label-input')).toHaveValue('Boat 1');
  await expect(page.getByTestId('remove-boat')).toBeDisabled();
  await expect(page.getByTestId('remove-boat-description')).toContainText(
    /one|last|least/i,
  );
  const final = await scenario(page);
  expect(final.boats).toHaveLength(1);
  expect(final.keyframes.every((frame) => frame.boatStates.length === 1)).toBe(
    true,
  );
  expect(final.observedEvents).toEqual([]);
  await page.screenshot({
    path: test.info().outputPath('last-boat.png'),
    fullPage: true,
  });
  await page.getByTestId('add-boat').click();
  await expect(page.getByTestId('remove-boat')).toBeEnabled();
  await expect(page.getByTestId('heading-alignment-status')).toHaveAttribute(
    'data-alignment-enabled',
    'true',
  );
});

test('clears captured gestures when a boat is removed', async ({ page }) => {
  await page.goto('/editor');
  await page.getByTestId('add-boat').click();
  await page.getByTestId('heading-input').fill('135');
  const added = await scenario(page);
  const boatId = added.boats.at(-1)!.id;
  const state = added.keyframes[0].boatStates.find(
    (item) => item.boatId === boatId,
  )!;
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  const screenPoint = (x: number, y: number) =>
    page
      .getByTestId('editor-diagram')
      .locator('svg')
      .evaluate(
        (svg, value) => {
          const point = (svg as SVGSVGElement).createSVGPoint();
          point.x = value.x;
          point.y = 8 - value.y;
          const result = point.matrixTransform(
            (svg as SVGSVGElement).getScreenCTM()!,
          );
          return { x: result.x, y: result.y };
        },
        { x, y },
      );
  const start = await screenPoint(state.position.x, state.position.y);
  const end = await screenPoint(
    Math.min(7, state.position.x + 0.5),
    Math.min(7, state.position.y + 0.5),
  );
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 4 });
  await page
    .getByTestId('remove-boat')
    .evaluate((button: HTMLButtonElement) => button.click());
  const removed = await scenario(page);
  expect(removed.boats.some((boat) => boat.id === boatId)).toBe(false);
  await page.mouse.move(start.x, start.y, { steps: 4 });
  await page
    .getByTestId('editor-diagram')
    .locator('svg')
    .dispatchEvent('pointercancel', {
      pointerId: 1,
      pointerType: 'mouse',
      bubbles: true,
    });
  await page.mouse.up();
  expect(await scenario(page)).toEqual(removed);
  await page.getByTestId('boat-x-input').fill('2');
  await expect(page.getByTestId('boat-x-input')).toHaveValue('2');
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await page.getByTestId('add-boat').click();
  expect((await scenario(page)).boats.at(-1)!.id).toBe(boatId);
  await expect(page.getByTestId('heading-alignment-status')).toHaveAttribute(
    'data-alignment-enabled',
    'true',
  );
});
