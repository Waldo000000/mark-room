import { expect, test } from '@playwright/test';

import { inferTackFromHeading } from '../../src/domain/scenario/geometry';
import type { Scenario } from '../../src/domain/scenario/schema';

test('renders geometry, facts, and finding from the same scenario JSON', async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await page.goto('/scenarios/port-starboard');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Port meets starboard',
  );

  const jsonText = await page.getByTestId('scenario-json').textContent();
  const scenario = JSON.parse(jsonText ?? '') as Scenario;
  const keyframe = scenario.keyframes[0];

  await expect(page.getByTestId('wind-indicator')).toHaveAttribute(
    'data-wind-from-degrees',
    String(scenario.wind.fromDegrees),
  );
  await expect(page.getByTestId('wind-indicator')).toHaveAttribute(
    'transform',
    `translate(10 12) rotate(${scenario.wind.fromDegrees})`,
  );

  const windLine = page.getByTestId('wind-indicator').locator('line');
  expect(Number(await windLine.getAttribute('y2'))).toBeGreaterThan(
    Number(await windLine.getAttribute('y1')),
  );

  for (const state of keyframe.boatStates) {
    const renderedBoat = page.getByTestId(`boat-${state.boatId}`);
    const screenY = scenario.sailingArea.height - state.position.y;

    await expect(renderedBoat).toHaveAttribute(
      'data-heading-degrees',
      String(state.headingDegrees),
    );
    await expect(renderedBoat.locator('g')).toHaveAttribute(
      'transform',
      `translate(${state.position.x} ${screenY}) rotate(${state.headingDegrees})`,
    );
  }

  for (const fact of scenario.facts) {
    if (fact.type !== 'tack') continue;

    const state = keyframe.boatStates.find(
      (candidate) => candidate.boatId === fact.boatId,
    );
    expect(state, `missing rendered state for ${fact.boatId}`).toBeDefined();
    expect(
      inferTackFromHeading(state!.headingDegrees, scenario.wind.fromDegrees),
    ).toBe(fact.tack);
  }

  const finding = scenario.ruling.findings[0];
  const subject = scenario.boats.find(
    (boat) => boat.id === finding.subjectBoat,
  );
  const other = scenario.boats.find((boat) => boat.id === finding.otherBoat);

  await expect(
    page.getByRole('heading', {
      name: `${subject?.label} must keep clear of ${other?.label}.`,
    }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveJSProperty(
    'scrollWidth',
    await page.locator('html').evaluate((element) => element.clientWidth),
  );
  expect(runtimeErrors).toEqual([]);
});
