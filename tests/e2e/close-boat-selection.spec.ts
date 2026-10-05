import { expect, test, type Page, type BrowserContext } from '@playwright/test';
import type { Scenario } from '../../src/domain/scenario/schema';
import {
  BOAT_HULL_PATH,
  BOAT_GLYPH_SCALE,
} from '../../src/components/scenario/boat-glyph';

async function scenario(page: Page): Promise<Scenario> {
  return JSON.parse(
    (await page.getByTestId('editor-scenario-json').textContent())!,
  );
}

async function point(page: Page, x: number, y: number) {
  return page
    .getByTestId('editor-diagram')
    .locator('svg')
    .evaluate(
      (svg, coordinates) => {
        const p = (svg as SVGSVGElement).createSVGPoint();
        p.x = coordinates.x;
        p.y = 8 - coordinates.y;
        const screen = p.matrixTransform(
          (svg as SVGSVGElement).getScreenCTM()!,
        );
        return { x: screen.x, y: screen.y };
      },
      { x, y },
    );
}

async function gesture(
  page: Page,
  context: BrowserContext,
  start: { x: number; y: number },
  end?: { x: number; y: number },
) {
  // A drag must cross the editor's existing four-screen-pixel threshold.
  if (end)
    expect(Math.hypot(end.x - start.x, end.y - start.y)).toBeGreaterThan(4);
  if (test.info().project.name === 'phone') {
    const session = await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [start],
    });
    if (end)
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [end],
      });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await session.detach();
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    if (end) await page.mouse.move(end.x, end.y, { steps: 8 });
    await page.mouse.up();
  }
}

test('keeps the selected overlapping boat through repeated zoomed drags and permits deliberate switching', async ({
  page,
  context,
}) => {
  await page.goto('/editor');
  const fixture = await scenario(page);
  fixture.keyframes[0].boatStates.forEach((state, index) => {
    state.position = { x: 4 + index * 0.15, y: 4 };
    state.headingDegrees = 0;
  });
  await page
    .getByTestId('import-scenario-json-input')
    .fill(JSON.stringify(fixture));
  await page.getByTestId('import-scenario-json').click();
  // Browser layout zoom changes the screen transform, without altering Scenario.
  await page.evaluate(() => {
    document.documentElement.style.zoom = '1.5';
  });
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  const diagram = page.getByTestId('editor-diagram');
  const overlap = await point(page, 4, 4);
  expect(
    await page.evaluate(
      (p) => document.elementFromPoint(p.x, p.y)?.getAttribute('data-testid'),
      overlap,
    ),
  ).toBe('editor-boat-hit-target-blue');
  await gesture(page, context, overlap);
  await expect(diagram).toHaveAttribute('data-selected-boat-id', 'blue');
  expect(await scenario(page)).toEqual(fixture);
  for (const [startX, endX] of [
    [4, 4.2],
    [4.2, 4.4],
  ]) {
    await gesture(
      page,
      context,
      await point(page, startX, 4),
      await point(page, endX, 4),
    );
    await expect(diagram).toHaveAttribute('data-selected-boat-id', 'blue');
    const current = await scenario(page);
    expect(current.keyframes[0].boatStates[0].position).toEqual({
      x: endX,
      y: 4,
    });
    expect(current.keyframes[0].boatStates[1]).toEqual(
      fixture.keyframes[0].boatStates[1],
    );
    expect(current.keyframes[1]).toEqual(fixture.keyframes[1]);
  }
  const beforeSwitch = await scenario(page);
  const exposed = await point(page, 3.94, 4);
  expect(
    await page.evaluate(
      (p) => document.elementFromPoint(p.x, p.y)?.getAttribute('data-testid'),
      exposed,
    ),
  ).toBe('editor-boat-hit-target-yellow');
  await gesture(page, context, exposed);
  await expect(diagram).toHaveAttribute('data-selected-boat-id', 'yellow');
  expect(await scenario(page)).toEqual(beforeSwitch);
  const hullTarget = page.getByTestId('editor-boat-hit-target-yellow');
  await expect(hullTarget).toHaveAttribute('d', BOAT_HULL_PATH);
  await expect(hullTarget).toHaveAttribute(
    'transform',
    `scale(${BOAT_GLYPH_SCALE})`,
  );
  const padding =
    (Number(await hullTarget.getAttribute('stroke-width')) * BOAT_GLYPH_SCALE) /
    2;
  expect(padding).toBeCloseTo(0.08);
  await expect(diagram).toHaveScreenshot('overlapping-boats.png', {
    maxDiffPixelRatio: 0.015,
  });
  // Switching selection at drag start must retain capture even as paint order changes.
  await gesture(page, context, await point(page, 4.55, 4));
  await expect(diagram).toHaveAttribute('data-selected-boat-id', 'blue');
  await gesture(
    page,
    context,
    await point(page, 3.94, 4),
    await point(page, 4.4, 4),
  );
  await expect(diagram).toHaveAttribute('data-selected-boat-id', 'yellow');
  const afterSwitchDrag = await scenario(page);
  expect(afterSwitchDrag.keyframes[0].boatStates[0]).toEqual(
    beforeSwitch.keyframes[0].boatStates[0],
  );
  expect(afterSwitchDrag.keyframes[0].boatStates[1].position).toEqual({
    x: 4.4,
    y: 4,
  });
  await gesture(page, context, await point(page, 4.75, 4));
  await expect(diagram).toHaveAttribute('data-selected-boat-id', '');
  expect(await scenario(page)).toEqual(afterSwitchDrag);
});
