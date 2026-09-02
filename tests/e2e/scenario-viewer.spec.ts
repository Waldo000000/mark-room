import { expect, test } from '@playwright/test';

import { deriveSailPresentation } from '../../src/components/scenario/boat-glyph';
import { inferTackFromHeading } from '../../src/domain/scenario/geometry';
import type { Scenario } from '../../src/domain/scenario/schema';
import type { Situation } from '../../src/domain/situation/schema';

test('renders Scenario geometry and expected Situation consistently', async ({
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
  const situationJsonText = await page
    .getByTestId('situation-json')
    .textContent();
  const situation = JSON.parse(situationJsonText ?? '') as Situation;
  const situationMoment = situation.moments[0];

  expect(scenario).not.toHaveProperty('lengthUnit');
  expect(scenario).not.toHaveProperty('teachingText');
  expect(scenario).not.toHaveProperty('provenance');
  expect(scenario).not.toHaveProperty('verification');
  expect(scenario).not.toHaveProperty('prompt');
  expect(scenario.sailingArea).toEqual({ width: 6, height: 6 });
  for (const state of keyframe.boatStates) {
    expect(state).not.toHaveProperty('sail');
    const situationState = situationMoment.boatStates.find(
      (candidate) => candidate.boatId === state.boatId,
    );
    expect(situationState?.tack).toBe(state.tack);
    expect(situationState).not.toHaveProperty('position');
    expect(situationState).not.toHaveProperty('headingDegrees');
  }
  expect(situation.scenarioId).toBe(scenario.id);
  await expect(
    page.getByText('Expected Situation', { exact: true }),
  ).toBeVisible();

  await expect(page.getByText('Unverified transcription')).toBeVisible();
  await expect(
    page.getByText(
      'On opposite tacks, identify the starboard-tack boat first; the port-tack boat must keep clear.',
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Open World Sailing source' }),
  ).toBeVisible();

  await expect(page.getByTestId('wind-indicator')).toHaveAttribute(
    'data-wind-from-degrees',
    String(scenario.wind.fromDegrees),
  );
  await expect(page.getByTestId('wind-indicator')).toHaveAttribute(
    'transform',
    `translate(0.6 0.72) rotate(${scenario.wind.fromDegrees})`,
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
    await expect(renderedBoat.locator(':scope > g')).toHaveAttribute(
      'transform',
      `translate(${state.position.x} ${screenY}) rotate(${state.headingDegrees})`,
    );

    const glyph = renderedBoat.getByTestId('boat-glyph');
    const sail = deriveSailPresentation(
      state.headingDegrees,
      scenario.wind.fromDegrees,
      state.tack,
    );
    await expect(glyph).toHaveAttribute('data-hull-length', '1');
    await expect(glyph).toHaveAttribute('data-sail-side', sail.side);
    await expect(glyph).toHaveAttribute(
      'data-trim-degrees',
      String(sail.trimDegrees),
    );
    await expect(glyph).toHaveAttribute('data-luffing', String(sail.luffing));

    const sailRotation =
      sail.side === 'port' ? sail.trimDegrees : -sail.trimDegrees;
    await expect(glyph.getByTestId('boat-sail')).toHaveAttribute(
      'transform',
      `rotate(${sailRotation} 0 -3)`,
    );

    const renderedHullLength = await renderedBoat
      .getByTestId('boat-hull')
      .evaluate((hull) => {
        const box = (hull as SVGGraphicsElement).getBBox();
        const matrix = (hull as SVGGraphicsElement).getScreenCTM();
        if (!matrix) throw new Error('Hull has no screen transform');

        const bow = new DOMPoint(box.x + box.width / 2, box.y).matrixTransform(
          matrix,
        );
        const stern = new DOMPoint(
          box.x + box.width / 2,
          box.y + box.height,
        ).matrixTransform(matrix);

        return Math.hypot(stern.x - bow.x, stern.y - bow.y);
      });
    const renderedScaleLength = await page
      .getByTestId('hull-length-scale-line')
      .evaluate((line) => {
        const x1 = Number(line.getAttribute('x1'));
        const x2 = Number(line.getAttribute('x2'));
        const y1 = Number(line.getAttribute('y1'));
        const y2 = Number(line.getAttribute('y2'));
        const matrix = (line as SVGGraphicsElement).getScreenCTM();
        if (!matrix) throw new Error('Scale has no screen transform');

        const start = new DOMPoint(x1, y1).matrixTransform(matrix);
        const end = new DOMPoint(x2, y2).matrixTransform(matrix);
        return Math.hypot(end.x - start.x, end.y - start.y);
      });
    expect(renderedHullLength).toBeCloseTo(renderedScaleLength, 1);
  }

  await expect(page.getByTestId('hull-length-scale')).toContainText(
    '1 hull length',
  );
  await expect(page.getByTestId('hull-length-scale')).toBeVisible();

  for (const state of keyframe.boatStates) {
    expect(
      inferTackFromHeading(state.headingDegrees, scenario.wind.fromDegrees),
    ).toBe(state.tack);
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
  await expect(page.getByTestId('scenario-diagram')).toHaveScreenshot(
    'port-starboard-diagram.png',
    {
      maxDiffPixelRatio: 0.005,
    },
  );
  expect(runtimeErrors).toEqual([]);
});
