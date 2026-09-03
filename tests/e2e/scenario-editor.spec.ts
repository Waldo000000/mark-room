import { expect, test } from '@playwright/test';

import type { Scenario } from '../../src/domain/scenario/schema';

function parseScenarioJson(text: string | null): Scenario {
  return JSON.parse(text ?? '') as Scenario;
}

test('edits scenario geometry across keyframes', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await page.goto('/');
  await page.getByRole('link', { name: 'Open editor' }).click();

  await expect(page).toHaveURL('/editor');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Edit scenario geometry' }),
  ).toBeVisible();
  await expect(page.getByTestId('scenario-validation')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-1',
  );
  await expect(page.getByTestId('ghost-boat-position-2-blue')).toBeVisible();

  await page.getByTestId('add-keyframe').click();

  await expect(page.getByTestId('keyframe-tab-position-3')).toHaveAttribute(
    'aria-current',
    'step',
  );
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-3',
  );

  await page.getByRole('button', { name: 'Yellow' }).click();
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-selected-boat-id',
    'yellow',
  );
  const diagramSvg = page.getByTestId('editor-diagram').locator('svg');
  const diagramSvgBox = await diagramSvg.boundingBox();
  if (!diagramSvgBox) {
    throw new Error('Expected editor SVG bounds');
  }

  await diagramSvg.click({
    position: {
      x: diagramSvgBox.width * 0.25,
      y: diagramSvgBox.height * 0.25,
    },
  });

  const tappedScenario = parseScenarioJson(
    await page.getByTestId('editor-scenario-json').textContent(),
  );
  const tappedYellow = tappedScenario.keyframes[2].boatStates.find(
    (state) => state.boatId === 'yellow',
  );

  expect(tappedYellow?.position.x).toBeGreaterThan(1.5);
  expect(tappedYellow?.position.x).toBeLessThan(2.5);
  expect(tappedYellow?.position.y).toBeGreaterThan(5.5);
  expect(tappedYellow?.position.y).toBeLessThan(6.5);

  await page.getByTestId('boat-x-input').fill('5.2');
  await page.getByTestId('boat-y-input').fill('3.4');
  await page.getByTestId('heading-input').fill('135');

  const scenario = parseScenarioJson(
    await page.getByTestId('editor-scenario-json').textContent(),
  );
  const thirdKeyframe = scenario.keyframes.find(
    (keyframe) => keyframe.id === 'position-3',
  );
  const secondKeyframe = scenario.keyframes.find(
    (keyframe) => keyframe.id === 'position-2',
  );
  const yellow = thirdKeyframe?.boatStates.find(
    (state) => state.boatId === 'yellow',
  );

  expect(scenario.keyframes).toHaveLength(3);
  expect(thirdKeyframe?.label).toBe('Position 3');
  expect(secondKeyframe?.boatStates).toContainEqual(
    expect.objectContaining({
      boatId: 'yellow',
      position: { x: 4.3, y: 4.9 },
    }),
  );
  expect(yellow).toMatchObject({
    boatId: 'yellow',
    position: { x: 5.2, y: 3.4 },
    headingDegrees: 135,
    tack: 'port',
  });

  const renderedYellow = page.getByTestId('editor-boat-yellow');
  await expect(renderedYellow.locator(':scope > g').first()).toHaveAttribute(
    'transform',
    'translate(5.2 4.6) rotate(135)',
  );
  await expect(page.locator('html')).toHaveJSProperty(
    'scrollWidth',
    await page.locator('html').evaluate((element) => element.clientWidth),
  );
  expect(runtimeErrors).toEqual([]);
});
