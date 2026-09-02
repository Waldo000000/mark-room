import { expect, test } from '@playwright/test';

import type { ScenarioEvalCase } from '../../src/domain/eval/schema';
import { inferTackFromHeading } from '../../src/domain/scenario/geometry';

const expectedScenarios = [
  {
    slug: 'port-starboard',
    title: 'Port meets starboard',
    obligation: {
      boatId: 'yellow',
      owedToBoatId: 'blue',
      type: 'keep-clear',
      ruleRef: 'RRS 10',
    },
    tackByBoat: { blue: 'starboard', yellow: 'port' },
    overlap: false,
  },
  {
    slug: 'windward-leeward',
    title: 'Windward and leeward',
    obligation: {
      boatId: 'yellow',
      owedToBoatId: 'blue',
      type: 'keep-clear',
      ruleRef: 'RRS 11',
    },
    tackByBoat: { blue: 'starboard', yellow: 'starboard' },
    overlap: true,
  },
] as const;

test('lists every sailor-facing corpus scenario', async ({ page }) => {
  await page.goto('/scenarios');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Read the situation. Check the ruling.',
  );
  await expect(page.getByTestId('scenario-card-port-starboard')).toContainText(
    'RRS 10',
  );
  await expect(
    page.getByTestId('scenario-card-windward-leeward'),
  ).toContainText('RRS 11');
  await expect(page.getByRole('link', { name: 'Open scenario' })).toHaveCount(
    2,
  );
});

for (const expectedScenario of expectedScenarios) {
  test(`${expectedScenario.slug} renders Scenario, Situation, and Ruling semantics`, async ({
    page,
  }) => {
    const runtimeErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(message.text());
    });
    page.on('pageerror', (error) => runtimeErrors.push(error.message));

    await page.goto(`/scenarios/${expectedScenario.slug}`);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      expectedScenario.title,
    );
    await expect(page.getByTestId('verification-status')).toHaveText(
      'Unverified transcription',
    );
    await expect(
      page.getByText('Expected situation', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('Expected ruling', { exact: true }),
    ).toBeVisible();

    const jsonText = await page.getByTestId('scenario-json').textContent();
    const evalCase = JSON.parse(jsonText ?? '') as ScenarioEvalCase;
    const scenario = evalCase.input;
    const situation = evalCase.expected.situation;
    const ruling = evalCase.expected.ruling;
    const keyframe = scenario.keyframes[0];
    const moment = situation.moments[0];

    expect(scenario).not.toHaveProperty('ruling');
    expect(scenario).not.toHaveProperty('facts');
    expect(situation).not.toHaveProperty('sailingArea');

    await expect(page.locator('main')).toHaveAttribute(
      'data-scenario-id',
      scenario.id,
    );
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
      const situationState = moment.boatStates.find(
        (candidate) => candidate.boatId === state.boatId,
      );
      expect(situationState).toBeDefined();

      const renderedBoat = page.getByTestId(`boat-${state.boatId}`);
      const screenY = scenario.sailingArea.height - state.position.y;
      const labelOnLeft = state.position.x < scenario.sailingArea.width / 2;

      await expect(renderedBoat).toHaveAttribute(
        'data-heading-degrees',
        String(state.headingDegrees),
      );
      await expect(renderedBoat.locator(':scope > g')).toHaveAttribute(
        'transform',
        `translate(${state.position.x} ${screenY}) rotate(${state.headingDegrees})`,
      );
      await expect(
        page.getByTestId(`boat-label-${state.boatId}`),
      ).toHaveAttribute(
        'x',
        String(state.position.x + (labelOnLeft ? -11 : 11)),
      );
      await expect(
        page.getByTestId(`boat-label-${state.boatId}`),
      ).toHaveAttribute('text-anchor', labelOnLeft ? 'end' : 'start');

      const glyph = renderedBoat.getByTestId('boat-glyph');
      await expect(glyph).toHaveAttribute(
        'data-sail-side',
        situationState!.sail.side,
      );
      await expect(glyph).toHaveAttribute(
        'data-trim-degrees',
        String(situationState!.sail.trimDegrees),
      );
      await expect(glyph).toHaveAttribute(
        'data-luffing',
        String(situationState!.sail.luffing),
      );

      const sailRotation =
        situationState!.sail.side === 'port'
          ? situationState!.sail.trimDegrees
          : -situationState!.sail.trimDegrees;
      await expect(glyph.getByTestId('boat-sail')).toHaveAttribute(
        'transform',
        `rotate(${sailRotation} 0 -3)`,
      );
    }

    for (const state of keyframe.boatStates) {
      const labelBox = await page
        .getByTestId(`boat-label-${state.boatId}`)
        .boundingBox();
      expect(labelBox, `${state.boatId} label must be visible`).not.toBeNull();

      for (const otherState of keyframe.boatStates) {
        const glyphBox = await page
          .getByTestId(`boat-${otherState.boatId}`)
          .getByTestId('boat-glyph')
          .boundingBox();
        expect(
          glyphBox,
          `${otherState.boatId} glyph must be visible`,
        ).not.toBeNull();

        const intersects =
          labelBox!.x < glyphBox!.x + glyphBox!.width &&
          labelBox!.x + labelBox!.width > glyphBox!.x &&
          labelBox!.y < glyphBox!.y + glyphBox!.height &&
          labelBox!.y + labelBox!.height > glyphBox!.y;
        expect(
          intersects,
          `${state.boatId} label must not overlap ${otherState.boatId}`,
        ).toBe(false);
      }
    }

    for (const [boatId, expectedTack] of Object.entries(
      expectedScenario.tackByBoat,
    )) {
      const scenarioState = keyframe.boatStates.find(
        (candidate) => candidate.boatId === boatId,
      );
      const situationState = moment.boatStates.find(
        (candidate) => candidate.boatId === boatId,
      );
      expect(scenarioState).toBeDefined();
      expect(situationState).toBeDefined();
      expect(scenarioState!.tack).toBe(expectedTack);
      expect(situationState!.tack).toBe(expectedTack);
      expect(
        inferTackFromHeading(
          scenarioState!.headingDegrees,
          scenario.wind.fromDegrees,
        ),
      ).toBe(expectedTack);
      await expect(
        page.locator(`[data-situation-type="tack"][data-boat-id="${boatId}"]`),
      ).toContainText(new RegExp(`${expectedTack} tack`, 'i'));
    }

    const obligation = ruling.obligations[0];
    expect(obligation.boatId).toBe(expectedScenario.obligation.boatId);
    expect(obligation.owedToBoatId).toBe(
      expectedScenario.obligation.owedToBoatId,
    );
    expect(obligation.type).toBe(expectedScenario.obligation.type);
    expect(obligation.ruleRefs).toContain(expectedScenario.obligation.ruleRef);
    await expect(
      page.getByTestId(`obligation-${obligation.id}`),
    ).toHaveAttribute('data-obligation-type', expectedScenario.obligation.type);
    await expect(page.getByTestId(`obligation-${obligation.id}`)).toContainText(
      expectedScenario.obligation.ruleRef,
    );

    const overlapRelationships = moment.relationships.filter(
      (relationship) =>
        relationship.type === 'relative-position' &&
        relationship.relationship === 'overlapped',
    );
    expect(overlapRelationships.length > 0).toBe(expectedScenario.overlap);
    await expect(
      page.locator('[data-situation-type="relative-position"]'),
    ).toHaveCount(expectedScenario.overlap ? 1 : 0);

    if (expectedScenario.slug === 'windward-leeward') {
      await expect(
        page.locator('[data-situation-type="windward-leeward"]'),
      ).toContainText('Yellow is windward of Blue');

      const yellowBox = await page
        .getByTestId('boat-yellow')
        .getByTestId('boat-glyph')
        .boundingBox();
      const blueBox = await page
        .getByTestId('boat-blue')
        .getByTestId('boat-glyph')
        .boundingBox();
      expect(yellowBox, 'Yellow must be visible').not.toBeNull();
      expect(blueBox, 'Blue must be visible').not.toBeNull();
      expect(yellowBox!.y).toBeLessThan(blueBox!.y);
    }

    await expect(page.locator('html')).toHaveJSProperty(
      'scrollWidth',
      await page.locator('html').evaluate((element) => element.clientWidth),
    );
    await expect(page.getByTestId('scenario-diagram')).toHaveScreenshot(
      `${expectedScenario.slug}-diagram.png`,
      { maxDiffPixelRatio: 0.005 },
    );
    expect(runtimeErrors).toEqual([]);
  });
}
