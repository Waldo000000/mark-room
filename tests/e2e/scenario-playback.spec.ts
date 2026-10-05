import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Scenario } from '../../src/domain/scenario/schema';

test('plays and pauses the editor preview without changing authored data', async ({
  page,
}) => {
  await page.goto('/editor');
  await page.clock.install({ time: new Date('2026-10-05T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-05T00:00:01Z'));
  const before: Scenario = JSON.parse(
    (await page.getByTestId('editor-scenario-json').textContent())!,
  );
  const selected = await page
    .getByTestId('editor-diagram')
    .getAttribute('data-active-keyframe-id');
  await page
    .getByRole('button', { name: 'Play scenario', exact: true })
    .click();
  const preview = page.getByRole('dialog', { name: 'Scenario playback' });
  await expect(preview).toBeVisible();
  await page.clock.runFor(250);
  await preview.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(preview.getByText('Paused', { exact: true })).toBeVisible();
  const time = await preview.getByTestId('playback-time').textContent();
  const blue = preview.getByTestId('playback-boat-blue');
  const x = Number(await blue.getAttribute('data-x'));
  expect(x).toBeGreaterThan(before.keyframes[0].boatStates[0].position.x);
  expect(x).toBeLessThan(before.keyframes[1].boatStates[0].position.x);
  await expect(blue.getByTestId('boat-glyph')).toHaveAttribute(
    'data-hull-length',
    '1',
  );
  await expect(blue.getByTestId('boat-glyph')).toHaveAttribute(
    'data-sail-side',
    'port',
  );
  await expect(preview.getByTestId('playback-diagram')).toHaveAttribute(
    'data-wind-from-degrees',
    '0',
  );
  await expect(preview.getByTestId('playback-diagram')).toHaveScreenshot(
    'paused-motion.png',
    { maxDiffPixelRatio: 0.015 },
  );
  await page.clock.runFor(500);
  await expect(preview.getByTestId('playback-time')).toHaveText(time!);
  expect(Number(await blue.getAttribute('data-x'))).toBe(x);
  await preview.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.runFor(1100);
  await expect(preview.getByText('Finished', { exact: true })).toBeVisible();
  await expect(preview.getByTestId('playback-time')).toHaveText(
    '1.00 / 1.00 s',
  );
  for (const state of before.keyframes.at(-1)!.boatStates) {
    const boat = preview.getByTestId(`playback-boat-${state.boatId}`);
    await expect(boat).toHaveAttribute('data-x', String(state.position.x));
    await expect(boat).toHaveAttribute('data-y', String(state.position.y));
    await expect(boat).toHaveAttribute(
      'data-heading',
      String(state.headingDegrees),
    );
    await expect(boat).toHaveAttribute('data-tack', state.tack);
  }
  await preview.getByRole('button', { name: 'Replay', exact: true }).click();
  await expect(preview.getByTestId('playback-time')).toHaveText(
    '0.00 / 1.00 s',
  );
  await page.keyboard.press('Escape');
  await expect(preview).not.toBeVisible();
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    selected!,
  );
  expect(
    JSON.parse((await page.getByTestId('editor-scenario-json').textContent())!),
  ).toEqual(before);
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('download-scenario-json').click();
  const download = await downloadPromise;
  expect(JSON.parse(await readFile((await download.path())!, 'utf8'))).toEqual(
    before,
  );
});

test('offers the same isolated preview in the viewer and fits narrow screens', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/scenarios/port-starboard');
  const beforeUrl = page.url();
  await page
    .getByRole('button', { name: 'Play scenario', exact: true })
    .click();
  const preview = page.getByRole('dialog', { name: 'Scenario playback' });
  await expect(preview).toBeVisible();
  await expect(preview).toContainText('not a physical simulation');
  const box = await preview.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  expect(
    await preview.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await preview.getByRole('button', { name: 'Close playback' }).click();
  await expect(preview).not.toBeVisible();
  expect(page.url()).toBe(beforeUrl);
  await page.setViewportSize({ width: 844, height: 390 });
  await page
    .getByRole('button', { name: 'Play scenario', exact: true })
    .click();
  await expect(preview).toBeVisible();
  const landscapeBox = await preview.boundingBox();
  expect(landscapeBox!.height).toBeLessThanOrEqual(390);
  const close = preview.getByRole('button', { name: 'Close playback' });
  expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await close.click();
  await expect(preview).not.toBeVisible();
});
