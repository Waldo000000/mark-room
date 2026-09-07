import { expect, test, type Page, type BrowserContext } from '@playwright/test';
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
      (svg, value) => {
        const p = (svg as SVGSVGElement).createSVGPoint();
        p.x = value.x;
        p.y = 8 - value.y;
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

test('blank water clears selection without moving geometry and keeps an empty selection on reload', async ({
  page,
  context,
}) => {
  await page.goto('/editor');
  const before = await scenario(page);
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  await gesture(page, context, await screenPoint(page, 1, 4));
  expect(await scenario(page)).toEqual(before);
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-selected-boat-id',
    '',
  );
  await expect(page.getByTestId('rotation-handle-blue')).toHaveCount(0);
  await expect(page.getByTestId('selection-ring-blue')).toHaveCount(0);
  await expect(page.getByTestId('remove-boat')).toBeDisabled();
  await expect(page.getByTestId('heading-input')).toHaveCount(0);
  await page.screenshot({
    path: test.info().outputPath('no-boat-selected.png'),
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-selected-boat-id',
    '',
  );
  expect(await scenario(page)).toEqual(before);
  await page
    .getByTestId('boat-picker')
    .getByRole('button', { name: 'Yellow', exact: true })
    .click();
  await expect(page.getByTestId('rotation-handle-yellow')).toBeVisible();
  expect(await scenario(page)).toEqual(before);
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  await gesture(page, context, await screenPoint(page, 1, 4));
  await page.getByTestId('add-boat').click();
  expect((await scenario(page)).boats).toHaveLength(3);
  await expect(page.getByTestId('remove-boat')).toBeEnabled();
});

test('boat taps select without movement and boat or mark drags still move their targets', async ({
  page,
  context,
}) => {
  await page.goto('/editor');
  const before = await scenario(page);
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  await gesture(page, context, await screenPoint(page, 1, 4));
  await gesture(page, context, await screenPoint(page, 3.2, 5.8));
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-selected-boat-id',
    'blue',
  );
  expect(await scenario(page)).toEqual(before);
  // Start a separate drag after selecting through the persistent picker.
  await page
    .getByTestId('boat-picker')
    .getByRole('button', { name: 'Blue', exact: true })
    .click();
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  await gesture(
    page,
    context,
    await screenPoint(page, 3.2, 5.8),
    await screenPoint(page, 2, 4),
  );
  const boatMoved = await scenario(page);
  expect(boatMoved.keyframes[0].boatStates[0].position).toEqual({ x: 2, y: 4 });
  expect(boatMoved.keyframes[0].boatStates[1]).toEqual(
    before.keyframes[0].boatStates[1],
  );
  expect(boatMoved.courseFeatures).toEqual(before.courseFeatures);
  await gesture(
    page,
    context,
    await screenPoint(page, 4, 2),
    await screenPoint(page, 5, 2),
  );
  const markMoved = await scenario(page);
  expect(markMoved.keyframes).toEqual(boatMoved.keyframes);
  expect(markMoved.courseFeatures[0]).toMatchObject({
    position: { x: 5, y: 2 },
  });
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-selected-boat-id',
    '',
  );
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
});
