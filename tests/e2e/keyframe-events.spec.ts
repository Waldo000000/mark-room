import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Scenario } from '../../src/domain/scenario/schema';

async function scenario(page: Page): Promise<Scenario> {
  return JSON.parse(
    (await page.getByTestId('editor-scenario-json').textContent()) ?? '',
  );
}

test('deleting a position removes only its events and keeps the exported draft valid', async ({
  page,
}) => {
  await page.goto('/editor');
  const imported = await scenario(page);
  imported.observedEvents = [
    {
      id: 'first-hail',
      type: 'hail',
      atKeyframe: 'position-1',
      boatId: 'blue',
      message: 'Room',
    },
    {
      id: 'first-penalty',
      type: 'penalty-taken',
      atKeyframe: 'position-1',
      boatId: 'yellow',
      penaltyType: 'one-turn',
    },
    {
      id: 'second-hail',
      type: 'hail',
      atKeyframe: 'position-2',
      boatId: 'yellow',
      message: 'Protest',
    },
  ];
  await page
    .getByTestId('import-scenario-json-input')
    .fill(JSON.stringify(imported));
  await page.getByTestId('import-scenario-json').click();
  await page.getByTestId('heading-input').fill('135');
  const before = await scenario(page);
  await expect(page.getByTestId('delete-keyframe-description')).toHaveText(
    'Deleting this position also removes 2 related events.',
  );
  await page.screenshot({
    path: test.info().outputPath('delete-position-events.png'),
    fullPage: true,
  });
  if (test.info().project.name === 'phone')
    await page.getByTestId('delete-keyframe').tap();
  else await page.getByTestId('delete-keyframe').click();
  const after = await scenario(page);
  expect(after).toEqual({
    ...before,
    keyframes: [before.keyframes[1]],
    observedEvents: [before.observedEvents[2]],
  });
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-2',
  );
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await expect(page.getByTestId('delete-keyframe')).toBeDisabled();
  await expect(page.getByTestId('delete-keyframe-description')).toHaveText(
    'A scenario must keep at least one position.',
  );
  await page.screenshot({
    path: test.info().outputPath('last-position.png'),
    fullPage: true,
  });
  const savedPairs = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('mark-room.editor.scenario-draft.v1')!)
        .metadata?.disabledHeadingAlignmentPairs ?? [],
  );
  expect(savedPairs).toEqual([]);
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('download-scenario-json').click();
  expect(
    JSON.parse(await readFile((await (await downloadPromise).path())!, 'utf8')),
  ).toEqual(after);
  await page.reload();
  await expect.poll(() => scenario(page)).toEqual(after);
  await page.getByTestId('add-keyframe').click();
  const reused = await scenario(page);
  expect(reused.keyframes.map((frame) => frame.id)).toEqual([
    'position-2',
    'position-1',
  ]);
  expect(reused.observedEvents).toEqual(after.observedEvents);
  await expect(page.getByTestId('delete-keyframe-description')).toHaveText(
    'This position has no related events.',
  );
  await expect(page.getByTestId('heading-alignment-status')).toHaveAttribute(
    'data-alignment-enabled',
    'true',
  );
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
});
