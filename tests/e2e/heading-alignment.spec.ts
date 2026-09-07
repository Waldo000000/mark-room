import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Scenario } from '../../src/domain/scenario/schema';

async function scenario(page: Page): Promise<Scenario> {
  return JSON.parse(
    (await page.getByTestId('editor-scenario-json').textContent()) ?? '',
  );
}

async function setup(page: Page) {
  await page.goto('/editor');
  const imported = await scenario(page);
  imported.keyframes[0].boatStates[0].position = { x: 4, y: 4 };
  imported.keyframes[0].boatStates[1].position = { x: 1, y: 1 };
  imported.keyframes[1].boatStates[0].position = { x: 4, y: 3 };
  imported.keyframes[1].boatStates[1].position = { x: 2, y: 1 };
  await page
    .getByTestId('import-scenario-json-input')
    .fill(JSON.stringify(imported));
  await page.getByTestId('import-scenario-json').click();
  await page
    .getByTestId('editor-position-selector')
    .getByRole('button', { name: 'Position 2', exact: true })
    .click();
  return imported;
}

async function position(page: Page, x: number, y: number) {
  await page.getByTestId('boat-x-input').fill(String(x));
  await page.getByTestId('boat-y-input').fill(String(y));
}

async function screenPoint(page: Page, x: number, y: number) {
  return page
    .getByTestId('editor-diagram')
    .locator('svg')
    .evaluate(
      (svg, value) => {
        const point = (svg as SVGSVGElement).createSVGPoint();
        point.x = value.x;
        point.y = 8 - value.y;
        const p = point.matrixTransform((svg as SVGSVGElement).getScreenCTM()!);
        return { x: p.x, y: p.y };
      },
      { x, y },
    );
}

test('aligns numeric moves with the immediately previous position without rewriting history', async ({
  page,
}) => {
  const before = await setup(page);
  expect(await scenario(page)).toEqual(before);
  for (const [x, y, heading] of [
    [4, 6, 0],
    [6, 6, 45],
    [6, 4, 90],
    [6, 2, 135],
    [4, 2, 180],
    [2, 2, 225],
    [2, 4, 270],
    [2, 6, 315],
    [3.99, 6, 0],
  ]) {
    await position(page, x, y);
    await expect(page.getByTestId('heading-input')).toHaveValue(
      String(heading),
    );
    await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
      'data-valid',
      'true',
    );
  }
  await position(page, 4, 4);
  await expect(page.getByTestId('heading-input')).toHaveValue('0');
  const coincident = await scenario(page);
  expect(coincident.keyframes[0]).toEqual(before.keyframes[0]);
  expect(coincident.keyframes[1].boatStates[1]).toEqual(
    before.keyframes[1].boatStates[1],
  );
  await position(page, 6, 6);
  const aligned = await scenario(page);
  await expect(
    page.getByTestId('editor-boat-blue').getByTestId('boat-glyph'),
  ).toHaveAttribute('data-sail-side', 'starboard');
  await expect(
    page.getByTestId('editor-boat-blue').getByTestId('boat-glyph'),
  ).toHaveAttribute('data-trim-degrees', '16');
  await expect(
    page
      .getByTestId('editor-boat-blue')
      .getByTestId('boat-glyph')
      .locator('..'),
  ).toHaveAttribute('transform', 'translate(6 2) rotate(45)');
  await page.screenshot({
    path: test.info().outputPath('aligned-boat.png'),
    fullPage: true,
  });
  await page
    .getByTestId('editor-position-selector')
    .getByRole('button', { name: 'Position 1', exact: true })
    .click();
  await position(page, 5, 5);
  await expect(page.getByTestId('heading-input')).toHaveValue('180');
  expect((await scenario(page)).keyframes[1]).toEqual(aligned.keyframes[1]);
});

test('manual heading persists for its boat and keyframe through reload and export', async ({
  page,
}) => {
  await setup(page);
  await page.getByTestId('heading-input').fill('135');
  await position(page, 6, 6);
  await expect(page.getByTestId('heading-input')).toHaveValue('135');
  await page
    .getByTestId('boat-picker')
    .getByRole('button', { name: 'Yellow', exact: true })
    .click();
  await position(page, 6, 6);
  await expect(page.getByTestId('heading-input')).toHaveValue('45');
  await page.reload();
  await expect(page.getByTestId('heading-input')).toHaveValue('45');
  await page
    .getByTestId('boat-picker')
    .getByRole('button', { name: 'Blue', exact: true })
    .click();
  await position(page, 2, 2);
  await expect(page.getByTestId('heading-input')).toHaveValue('135');
  const after = await scenario(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('download-scenario-json').click();
  expect(
    JSON.parse(await readFile((await (await downloadPromise).path())!, 'utf8')),
  ).toEqual(after);
  expect(Object.keys(after)).toEqual([
    'schemaVersion',
    'id',
    'title',
    'context',
    'sailingArea',
    'wind',
    'boats',
    'keyframes',
    'courseFeatures',
    'observedEvents',
  ]);
  await page
    .getByTestId('import-scenario-json-input')
    .fill(JSON.stringify(after));
  await page.getByTestId('import-scenario-json').click();
  await page
    .getByTestId('editor-position-selector')
    .getByRole('button', { name: 'Position 2', exact: true })
    .click();
  await position(page, 6, 6);
  await expect(page.getByTestId('heading-input')).toHaveValue('45');
});

test('aligns touch movement and restores position and heading together on cancellation', async ({
  page,
  context,
}) => {
  await setup(page);
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  const before = await scenario(page);
  const start = await screenPoint(page, 4, 3);
  const end = await screenPoint(page, 6, 4);
  const session = await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [start],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [end],
  });
  await expect(page.getByTestId('heading-input')).toHaveValue('90');
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchCancel',
    touchPoints: [],
  });
  expect(await scenario(page)).toEqual(before);
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
  expect((await scenario(page)).keyframes[1].boatStates[0]).toMatchObject({
    position: { x: 6, y: 4 },
    headingDegrees: 90,
    tack: 'port',
  });
  await session.detach();
});

test('committed handle rotation disables alignment while cancelled rotation preserves it', async ({
  page,
  context,
}) => {
  await setup(page);
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  const center = await screenPoint(page, 4, 3);
  const box = (await page.getByTestId('rotation-handle-blue').boundingBox())!;
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const end = {
    x: center.x - (start.y - center.y),
    y: center.y + (start.x - center.x),
  };
  const session = await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [start],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [end],
  });
  await expect(page.getByTestId('heading-input')).toHaveValue('270');
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchCancel',
    touchPoints: [],
  });
  await position(page, 6, 4);
  await expect(page.getByTestId('heading-input')).toHaveValue('90');
  await setup(page);
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  const nextBox = (await page
    .getByTestId('rotation-handle-blue')
    .boundingBox())!;
  const nextCenter = await screenPoint(page, 4, 3);
  const nextStart = {
    x: nextBox.x + nextBox.width / 2,
    y: nextBox.y + nextBox.height / 2,
  };
  const nextEnd = {
    x: nextCenter.x - (nextStart.y - nextCenter.y),
    y: nextCenter.y + (nextStart.x - nextCenter.x),
  };
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [nextStart],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [nextEnd],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  const manualHeading = (await scenario(page)).keyframes[1].boatStates[0]
    .headingDegrees;
  await position(page, 6, 4);
  await expect(page.getByTestId('heading-input')).toHaveValue(
    String(manualHeading),
  );
  await session.detach();
});

test('wheel rotation disables alignment for subsequent movement', async ({
  page,
}) => {
  test.skip(
    test.info().project.name === 'phone',
    'Native wheel shortcut is desktop only.',
  );
  await setup(page);
  await page.getByRole('heading', { level: 1 }).click();
  await page.getByTestId('editor-diagram').hover();
  await page.keyboard.down('ShiftLeft');
  await page.mouse.wheel(0, -100);
  await expect(page.getByTestId('heading-input')).toHaveValue('185');
  await page.keyboard.up('ShiftLeft');
  await position(page, 6, 4);
  await expect(page.getByTestId('heading-input')).toHaveValue('185');
});

test('keeping a conflicting saved draft also keeps its manual-heading settings', async ({
  page,
}) => {
  await setup(page);
  await page.getByTestId('heading-input').fill('135');
  await page.goto('/scenarios/port-starboard?position=position-2');
  await page.getByRole('link', { name: 'Edit scenario', exact: true }).click();
  await page
    .getByRole('button', { name: 'Keep saved draft', exact: true })
    .click();
  await expect(page).toHaveURL('/editor');
  await position(page, 6, 4);
  await expect(page.getByTestId('heading-input')).toHaveValue('135');
  await page.reload();
  await expect(page.getByTestId('heading-input')).toHaveValue('135');
});

test('keeps a captured move and its cancellation on the starting keyframe', async ({
  page,
}) => {
  await setup(page);
  await page.getByTestId('editor-diagram').scrollIntoViewIfNeeded();
  const before = await scenario(page);
  const start = await screenPoint(page, 4, 3);
  const end = await screenPoint(page, 6, 4);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 4 });
  await page
    .getByTestId('editor-position-selector')
    .getByRole('button', { name: 'Position 1', exact: true })
    .evaluate((button: HTMLButtonElement) => button.click());
  const later = await screenPoint(page, 5, 6);
  await page.mouse.move(later.x, later.y, { steps: 4 });
  const moved = await scenario(page);
  expect(moved.keyframes[0]).toEqual(before.keyframes[0]);
  expect(moved.keyframes[1].boatStates[0].position).toEqual({ x: 5, y: 6 });
  await page
    .getByTestId('editor-diagram')
    .locator('svg')
    .dispatchEvent('pointercancel', {
      pointerId: 1,
      pointerType: 'mouse',
      bubbles: true,
    });
  await page.mouse.up();
  expect(await scenario(page)).toEqual(before);
});
