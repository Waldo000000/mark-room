import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Scenario } from '../../src/domain/scenario/schema';

async function scenario(page: Page): Promise<Scenario> {
  return JSON.parse(
    (await page.getByTestId('editor-scenario-json').textContent()) ?? '',
  );
}

async function point(page: Page, x: number, y: number) {
  return page
    .getByTestId('editor-diagram')
    .locator('svg')
    .evaluate(
      (svg, position) => {
        const p = (svg as SVGSVGElement).createSVGPoint();
        p.x = position.x;
        p.y = 8 - position.y;
        const screen = p.matrixTransform(
          (svg as SVGSVGElement).getScreenCTM()!,
        );
        return { x: screen.x, y: screen.y };
      },
      { x, y },
    );
}

async function gesture(page: Page, degrees: number, offset = 0) {
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  const state = (await scenario(page)).keyframes[0].boatStates[0];
  const center = await point(page, state.position.x, state.position.y);
  const handle = await page.getByTestId('rotation-handle-blue').boundingBox();
  expect(handle).not.toBeNull();
  const start = {
    x: handle!.x + handle!.width / 2 + offset,
    y: handle!.y + handle!.height / 2,
  };
  const dx = start.x - center.x;
  const dy = start.y - center.y;
  const radians = (degrees * Math.PI) / 180;
  return {
    start,
    end: {
      x: center.x + dx * Math.cos(radians) - dy * Math.sin(radians),
      y: center.y + dx * Math.sin(radians) + dy * Math.cos(radians),
    },
  };
}

test('rotates without jumping or translating and persists sailing geometry', async ({
  page,
}) => {
  await page.goto('/editor');
  await page.getByTestId('boat-x-input').fill('4');
  await page.getByTestId('boat-y-input').fill('4');
  await page.getByTestId('heading-input').fill('350');
  const before = await scenario(page);
  const { start, end } = await gesture(page, 90, 6);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  expect(await scenario(page)).toEqual(before);
  await page.mouse.move(end.x, end.y, { steps: 12 });
  await page.mouse.up();
  const after = await scenario(page);
  const rotated = after.keyframes[0].boatStates[0];
  expect(rotated.headingDegrees).toBeCloseTo(80, 0);
  expect(rotated.position).toEqual(before.keyframes[0].boatStates[0].position);
  expect(rotated.tack).toBe('port');
  expect(after.keyframes[0].boatStates[1]).toEqual(
    before.keyframes[0].boatStates[1],
  );
  expect(after.keyframes[1]).toEqual(before.keyframes[1]);
  expect(after.courseFeatures).toEqual(before.courseFeatures);
  const glyph = page.getByTestId('editor-boat-blue').getByTestId('boat-glyph');
  await expect(glyph).toHaveAttribute('data-sail-side', 'starboard');
  await expect(glyph).toHaveAttribute('data-luffing', 'false');
  await expect(glyph).toHaveAttribute('data-trim-degrees', '45');
  await expect(glyph.locator('..')).toHaveAttribute(
    'transform',
    `translate(4 4) rotate(${rotated.headingDegrees})`,
  );
  await expect(page.getByTestId('editor-boat-blue')).toHaveAttribute(
    'data-heading-degrees',
    String(rotated.headingDegrees),
  );
  await expect(page.getByTestId('heading-input')).toHaveValue(
    String(rotated.headingDegrees),
  );
  await page.mouse.move(start.x, start.y);
  expect(await scenario(page)).toEqual(after);
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await page.screenshot({
    path: test.info().outputPath('rotated-boat.png'),
    fullPage: true,
  });
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('download-scenario-json').click();
  expect(
    JSON.parse(await readFile((await (await downloadPromise).path())!, 'utf8')),
  ).toEqual(after);
  await page.reload();
  await expect
    .poll(async () => (await scenario(page)).keyframes[0].boatStates[0])
    .toEqual(rotated);
});

test('separates native touch rotation from hull movement and restores cancelled rotation', async ({
  page,
  context,
}) => {
  await page.goto('/editor');
  await page.getByTestId('boat-x-input').fill('4');
  await page.getByTestId('boat-y-input').fill('4');
  const before = await scenario(page);
  const { start, end } = await gesture(page, 90);
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
  const rotated = await scenario(page);
  expect(rotated.keyframes[0].boatStates[0].headingDegrees).toBeCloseTo(270, 0);
  expect(rotated.keyframes[0].boatStates[0].position).toEqual(
    before.keyframes[0].boatStates[0].position,
  );
  const cancelled = await gesture(page, -90);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [cancelled.start],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [cancelled.end],
  });
  expect(
    (await scenario(page)).keyframes[0].boatStates[0].headingDegrees,
  ).not.toEqual(rotated.keyframes[0].boatStates[0].headingDegrees);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchCancel',
    touchPoints: [],
  });
  expect(await scenario(page)).toEqual(rotated);
  const hullStart = await point(page, 4, 4);
  const hullEnd = await point(page, 3, 4);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [hullStart],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [hullEnd],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  const moved = (await scenario(page)).keyframes[0].boatStates[0];
  expect(moved.position).toEqual({ x: 3, y: 4 });
  expect(moved.headingDegrees).toEqual(
    rotated.keyframes[0].boatStates[0].headingDegrees,
  );
  await session.detach();
});

test('keeps a generous attached handle inside each diagram corner', async ({
  page,
}) => {
  await page.goto('/editor');
  for (const [x, y] of [
    [0, 0],
    [0, 8],
    [8, 8],
    [8, 0],
  ]) {
    await page.getByTestId('boat-x-input').fill(String(x));
    await page.getByTestId('boat-y-input').fill(String(y));
    await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
    const svg = (await page
      .getByTestId('editor-diagram')
      .locator('svg')
      .boundingBox())!;
    const handle = (await page
      .getByTestId('rotation-handle-blue')
      .boundingBox())!;
    expect(handle.width).toBeGreaterThanOrEqual(43.9);
    expect(handle.height).toBeGreaterThanOrEqual(43.9);
    expect(handle.x).toBeGreaterThanOrEqual(svg.x - 1);
    expect(handle.y).toBeGreaterThanOrEqual(svg.y - 1);
    expect(handle.x + handle.width).toBeLessThanOrEqual(svg.x + svg.width + 1);
    expect(handle.y + handle.height).toBeLessThanOrEqual(
      svg.y + svg.height + 1,
    );
    const before = await scenario(page);
    await page.getByTestId('rotation-handle-blue').click();
    expect(await scenario(page)).toEqual(before);
  }
});

test('retains explicit tack at head to wind and follows selection', async ({
  page,
}) => {
  await page.goto('/editor');
  await page.getByTestId('boat-x-input').fill('4');
  await page.getByTestId('boat-y-input').fill('4');
  const { start, end } = await gesture(page, 180);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y);
  await page.mouse.up();
  const state = (await scenario(page)).keyframes[0].boatStates[0];
  expect(
    Math.min(state.headingDegrees, 360 - state.headingDegrees),
  ).toBeLessThan(0.5);
  expect(state.tack).toBe('starboard');
  const glyph = page.getByTestId('editor-boat-blue').getByTestId('boat-glyph');
  await expect(glyph).toHaveAttribute('data-luffing', 'true');
  await expect(glyph).toHaveAttribute('data-sail-side', 'port');
  await expect(
    glyph.getByTestId('boat-sail').locator('path').first(),
  ).toHaveAttribute('d', / C /);
  await page
    .getByTestId('boat-picker')
    .getByRole('button', { name: 'Yellow', exact: true })
    .click();
  await expect(page.getByTestId('rotation-handle-blue')).toHaveCount(0);
  await expect(page.getByTestId('rotation-handle-yellow')).toHaveCount(1);
  await page
    .getByTestId('editor-position-selector')
    .getByRole('button', { name: 'Position 2', exact: true })
    .click();
  await expect(page.getByTestId('heading-input')).toHaveValue('180');
  expect((await scenario(page)).keyframes[0].boatStates[0]).toEqual(state);
});

test('preserves the touch target when imported bounds shrink the boat glyphs', async ({
  page,
}) => {
  await page.goto('/editor');
  const imported = await scenario(page);
  imported.sailingArea = { width: 40, height: 40 };
  imported.keyframes[0].boatStates[0].position = { x: 20, y: 20 };
  await page
    .getByTestId('import-scenario-json-input')
    .fill(JSON.stringify(imported));
  await page.getByTestId('import-scenario-json').click();
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  await expect
    .poll(
      async () =>
        (await page.getByTestId('rotation-handle-blue').boundingBox())!.width,
    )
    .toBeGreaterThanOrEqual(43.9);
  const before = await scenario(page);
  await page.getByTestId('rotation-handle-blue').click();
  expect(await scenario(page)).toEqual(before);
});
