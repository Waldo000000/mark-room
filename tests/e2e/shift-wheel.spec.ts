import { expect, test, type Page } from '@playwright/test';
import type { Scenario } from '../../src/domain/scenario/schema';

async function scenario(page: Page): Promise<Scenario> {
  return JSON.parse(
    (await page.getByTestId('editor-scenario-json').textContent()) ?? '',
  );
}

async function heading(page: Page) {
  return (await scenario(page)).keyframes[0].boatStates[0].headingDegrees;
}

async function overDiagram(page: Page) {
  await page.getByRole('heading', { level: 1 }).click();
  await page.getByTestId('editor-diagram').hover();
}

test('rotates in both wheel directions, wraps heading, and releases ordinary scrolling', async ({
  page,
}) => {
  test.skip(
    test.info().project.name === 'phone',
    'Native wheel shortcut is a desktop interaction.',
  );
  await page.goto('/editor');
  const imported = await scenario(page);
  imported.keyframes[0].boatStates[0].headingDegrees = 349.8;
  await page
    .getByTestId('import-scenario-json-input')
    .fill(JSON.stringify(imported));
  await page.getByTestId('import-scenario-json').click();
  await overDiagram(page);
  const before = await scenario(page);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.keyboard.down('ShiftLeft');
  await page.mouse.wheel(0, -200);
  await expect.poll(() => heading(page)).toBe(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  await expect(
    page.getByTestId('editor-boat-blue').getByTestId('boat-glyph'),
  ).toHaveAttribute('data-luffing', 'true');
  expect((await scenario(page)).keyframes[0].boatStates[0].tack).toBe(
    'starboard',
  );
  await page.mouse.wheel(0, 100);
  await expect.poll(() => heading(page)).toBe(355);
  const after = await scenario(page);
  expect(after.keyframes[0].boatStates[0].position).toEqual(
    before.keyframes[0].boatStates[0].position,
  );
  expect(after.keyframes[0].boatStates[1]).toEqual(
    before.keyframes[0].boatStates[1],
  );
  expect(after.keyframes[1]).toEqual(before.keyframes[1]);
  await expect(page.getByTestId('heading-input')).toHaveValue('355');
  await expect(
    page
      .getByTestId('editor-boat-blue')
      .getByTestId('boat-glyph')
      .locator('..'),
  ).toHaveAttribute('transform', 'translate(3.2 2.2) rotate(355)');
  await page.screenshot({
    path: test.info().outputPath('shift-wheel.png'),
    fullPage: true,
  });
  await page.keyboard.up('ShiftLeft');
  await page.mouse.wheel(0, 150);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(scrollBefore);
  expect(await heading(page)).toBe(355);
  await page.reload();
  await expect.poll(() => heading(page)).toBe(355);
});

test('accumulates high-resolution input and resets remainder when Shift is released', async ({
  page,
}) => {
  test.skip(
    test.info().project.name === 'phone',
    'Native wheel shortcut is a desktop interaction.',
  );
  await page.goto('/editor');
  await overDiagram(page);
  await page.keyboard.down('ShiftLeft');
  for (let index = 0; index < 6; index++) await page.mouse.wheel(0, -3);
  expect(await heading(page)).toBe(180);
  await page.mouse.wheel(0, -3);
  await expect.poll(() => heading(page)).toBe(181);
  await page.mouse.wheel(0, -19);
  await expect.poll(() => heading(page)).toBe(182);
  await page.mouse.wheel(0, -19);
  await page.keyboard.up('ShiftLeft');
  await page.keyboard.down('ShiftLeft');
  await page.mouse.wheel(0, -1);
  expect(await heading(page)).toBe(182);
  await page.mouse.wheel(0, -19);
  await expect.poll(() => heading(page)).toBe(183);
  await page.mouse.wheel(0, -19);
  await page.getByRole('heading', { level: 1 }).hover();
  await page.getByTestId('editor-diagram').hover();
  await page.mouse.wheel(0, -1);
  expect(await heading(page)).toBe(183);
  await page.keyboard.up('ShiftLeft');
});

test('requires Left Shift and leaves other modifiers, fields, and outside wheel input alone', async ({
  page,
}) => {
  await page.goto('/editor');
  await overDiagram(page);
  const svg = page.getByTestId('editor-diagram').locator('svg');
  async function wheelOnDiagram(extra: Record<string, unknown> = {}) {
    return svg.evaluate(
      (element, options) =>
        element.dispatchEvent(
          new WheelEvent('wheel', {
            deltaY: -100,
            bubbles: true,
            cancelable: true,
            ...options,
          }),
        ),
      extra,
    );
  }
  expect(await wheelOnDiagram()).toBe(true);
  await page.keyboard.down('ShiftRight');
  expect(await wheelOnDiagram({ shiftKey: true })).toBe(true);
  await page.keyboard.up('ShiftRight');
  await page.keyboard.down('ShiftLeft');
  expect(await wheelOnDiagram({ shiftKey: true, ctrlKey: true })).toBe(true);
  expect(await wheelOnDiagram({ shiftKey: true, altKey: true })).toBe(true);
  expect(await wheelOnDiagram({ shiftKey: true, metaKey: true })).toBe(true);
  const outsideAllowed = await page
    .getByRole('heading', { level: 1 })
    .evaluate((element) =>
      element.dispatchEvent(
        new WheelEvent('wheel', {
          deltaY: -100,
          bubbles: true,
          cancelable: true,
          shiftKey: true,
        }),
      ),
    );
  expect(outsideAllowed).toBe(true);
  await page.getByTestId('boat-label-input').focus();
  expect(await wheelOnDiagram({ shiftKey: true })).toBe(true);
  expect(await heading(page)).toBe(180);
  await overDiagram(page);
  expect(await wheelOnDiagram({ shiftKey: true })).toBe(false);
  await expect.poll(() => heading(page)).toBe(185);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  expect(await wheelOnDiagram({ shiftKey: true })).toBe(true);
  expect(await heading(page)).toBe(185);
  await page.keyboard.up('ShiftLeft');
});

test('normalizes line/page deltas and resets remainder across boat and keyframe selection', async ({
  page,
}) => {
  await page.goto('/editor');
  await overDiagram(page);
  const svg = page.getByTestId('editor-diagram').locator('svg');
  const wheel = (deltaY: number, deltaMode = 0) =>
    svg.evaluate(
      (element, delta) =>
        element.dispatchEvent(
          new WheelEvent('wheel', {
            ...delta,
            shiftKey: true,
            bubbles: true,
            cancelable: true,
          }),
        ),
      { deltaY, deltaMode },
    );
  await page.keyboard.down('ShiftLeft');
  expect(await wheel(-2, 1)).toBe(false);
  await expect.poll(() => heading(page)).toBe(182);
  const height = (await page.getByTestId('editor-diagram').boundingBox())!
    .height;
  expect(await wheel(-1, 2)).toBe(false);
  await expect
    .poll(() => heading(page))
    .toBe((182 + Math.floor(height / 20)) % 360);
  await page.keyboard.up('ShiftLeft');
  await page.keyboard.down('ShiftLeft');
  await wheel(-19);
  const beforeSelection = await scenario(page);
  await page
    .getByTestId('boat-picker')
    .getByRole('button', { name: 'Yellow', exact: true })
    .click();
  await wheel(-1);
  expect((await scenario(page)).keyframes[0].boatStates[1].headingDegrees).toBe(
    180,
  );
  await wheel(-19);
  await expect
    .poll(
      async () =>
        (await scenario(page)).keyframes[0].boatStates[1].headingDegrees,
    )
    .toBe(181);
  await page
    .getByTestId('editor-position-selector')
    .getByRole('button', { name: 'Position 2', exact: true })
    .click();
  await wheel(-20);
  await expect
    .poll(
      async () =>
        (await scenario(page)).keyframes[1].boatStates[1].headingDegrees,
    )
    .toBe(181);
  expect((await scenario(page)).keyframes[0].boatStates[0]).toEqual(
    beforeSelection.keyframes[0].boatStates[0],
  );
  await page.keyboard.up('ShiftLeft');
});

test('does not rotate through wheel input while a pointer gesture owns the boat', async ({
  page,
}) => {
  await page.goto('/editor');
  await overDiagram(page);
  const handle = (await page
    .getByTestId('rotation-handle-blue')
    .boundingBox())!;
  await page.mouse.move(
    handle.x + handle.width / 2,
    handle.y + handle.height / 2,
  );
  await page.mouse.down();
  await page.keyboard.down('ShiftLeft');
  const allowed = await page
    .getByTestId('editor-diagram')
    .locator('svg')
    .evaluate((element) =>
      element.dispatchEvent(
        new WheelEvent('wheel', {
          deltaY: -100,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
  expect(allowed).toBe(true);
  expect(await heading(page)).toBe(180);
  await page.mouse.up();
  await page.keyboard.up('ShiftLeft');
});
