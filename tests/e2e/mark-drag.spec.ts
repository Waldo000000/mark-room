import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Scenario } from '../../src/domain/scenario/schema';

async function scenario(page: Page): Promise<Scenario> {
  return JSON.parse(
    (await page.getByTestId('editor-scenario-json').textContent()) ?? '',
  );
}

async function screenPoint(page: Page, x: number, y: number) {
  return page
    .getByTestId('editor-diagram')
    .locator('svg')
    .evaluate(
      (svg, position) => {
        const point = (svg as SVGSVGElement).createSVGPoint();
        point.x = position.x;
        point.y = 8 - position.y;
        const transformed = point.matrixTransform(
          (svg as SVGSVGElement).getScreenCTM()!,
        );
        return { x: transformed.x, y: transformed.y };
      },
      { x, y },
    );
}

test('drags a mark and its zone while preserving boats, drafts and downloads', async ({
  page,
}) => {
  await page.goto('/editor');
  const before = await scenario(page);
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  const start = await screenPoint(page, 4, 2);
  await page.mouse.click(start.x, start.y);
  expect(await scenario(page)).toEqual(before);
  const end = await screenPoint(page, 2, 3);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId('mark-x-input-leeward-mark')).toHaveValue('2');
  await expect(page.getByTestId('mark-y-input-leeward-mark')).toHaveValue('3');
  const mark = page.getByTestId('editor-mark-leeward-mark');
  await expect(mark).toHaveAttribute('data-position-x', '2');
  await expect(mark).toHaveAttribute('data-position-y', '3');
  const zone = page.getByTestId('editor-zone-leeward-mark');
  await expect(zone).toHaveAttribute('data-center-x', '2');
  await expect(zone).toHaveAttribute('data-center-y', '3');
  await expect(zone.locator('circle')).toHaveAttribute('cx', '2');
  await expect(zone.locator('circle')).toHaveAttribute('cy', '5');
  await expect(zone.locator('circle')).toHaveAttribute('r', '4');
  const after = await scenario(page);
  expect(after.keyframes).toEqual(before.keyframes);
  expect(after.boats).toEqual(before.boats);
  expect(after.courseFeatures[0]).toMatchObject({
    id: 'leeward-mark',
    position: { x: 2, y: 3 },
  });
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('download-scenario-json').click();
  const download = await downloadPromise;
  expect(JSON.parse(await readFile((await download.path())!, 'utf8'))).toEqual(
    after,
  );
  await page.reload();
  await expect(page.getByTestId('mark-x-input-leeward-mark')).toHaveValue('2');
  expect(await scenario(page)).toEqual(after);
});

test('clamps captured drags and stops updating after pointer cancellation', async ({
  page,
}) => {
  await page.goto('/editor');
  const before = await scenario(page);
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  const start = await screenPoint(page, 4, 2);
  const outside = await screenPoint(page, -1, 3);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(Math.max(0, outside.x), outside.y, { steps: 8 });
  await expect(page.getByTestId('mark-x-input-leeward-mark')).toHaveValue('0');
  const moved = await scenario(page);
  const svg = page.getByTestId('editor-diagram').locator('svg');
  await svg.dispatchEvent('pointercancel', {
    pointerId: 1,
    pointerType: 'mouse',
    bubbles: true,
  });
  const end = await screenPoint(page, 3, 4);
  await page.mouse.move(end.x, end.y, { steps: 4 });
  await page.mouse.up();
  expect(await scenario(page)).toEqual(moved);
  expect(moved.keyframes).toEqual(before.keyframes);
});

test('supports a native touch drag', async ({ page, context }) => {
  await page.goto('/editor');
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  const before = await scenario(page);
  const start = await screenPoint(page, 4, 2);
  const end = await screenPoint(page, 3, 3);
  const session = await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [start],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [end],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await expect(page.getByTestId('mark-x-input-leeward-mark')).toHaveValue('3');
  await expect(page.getByTestId('mark-y-input-leeward-mark')).toHaveValue('3');
  expect((await scenario(page)).keyframes).toEqual(before.keyframes);
  await session.detach();
});
