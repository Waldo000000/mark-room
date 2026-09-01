import { expect, test } from '@playwright/test';

import { inferTackFromHeading } from '../../src/domain/scenario/geometry';
import type { Scenario } from '../../src/domain/scenario/schema';

const expectedScenarios = [
  {
    slug: 'port-starboard',
    title: 'Port meets starboard',
    finding: {
      subjectBoat: 'yellow',
      otherBoat: 'blue',
      findingType: 'keep_clear',
      ruleRef: 'RRS 10',
    },
    tackByBoat: { blue: 'starboard', yellow: 'port' },
    overlap: false,
  },
  {
    slug: 'windward-leeward',
    title: 'Windward and leeward',
    finding: {
      subjectBoat: 'yellow',
      otherBoat: 'blue',
      findingType: 'keep_clear',
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
  test(`${expectedScenario.slug} renders the authored sailing semantics`, async ({
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

    const jsonText = await page.getByTestId('scenario-json').textContent();
    const scenario = JSON.parse(jsonText ?? '') as Scenario;
    const keyframe = scenario.keyframes[0];

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
      await expect(glyph).toHaveAttribute('data-sail-side', state.sail.side);
      await expect(glyph).toHaveAttribute(
        'data-trim-degrees',
        String(state.sail.trimDegrees),
      );
      await expect(glyph).toHaveAttribute(
        'data-luffing',
        String(state.sail.luffing),
      );

      const sailRotation =
        state.sail.side === 'port'
          ? state.sail.trimDegrees
          : -state.sail.trimDegrees;
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
      const tackFact = scenario.facts.find(
        (fact) => fact.type === 'tack' && fact.boatId === boatId,
      );
      expect(tackFact?.type).toBe('tack');
      if (!tackFact || tackFact.type !== 'tack') continue;

      const state = keyframe.boatStates.find(
        (candidate) => candidate.boatId === boatId,
      );
      expect(state, `missing rendered state for ${boatId}`).toBeDefined();
      expect(tackFact.tack).toBe(expectedTack);
      expect(
        inferTackFromHeading(state!.headingDegrees, scenario.wind.fromDegrees),
      ).toBe(expectedTack);
      await expect(
        page.locator(`[data-fact-type="tack"][data-boat-id="${boatId}"]`),
      ).toContainText(new RegExp(`${expectedTack} tack`, 'i'));
    }

    const finding = scenario.ruling.findings[0];
    expect(finding.subjectBoat).toBe(expectedScenario.finding.subjectBoat);
    expect(finding.otherBoat).toBe(expectedScenario.finding.otherBoat);
    expect(finding.findingType).toBe(expectedScenario.finding.findingType);
    expect(finding.ruleRefs).toContain(expectedScenario.finding.ruleRef);
    await expect(page.getByTestId(`finding-${finding.id}`)).toHaveAttribute(
      'data-finding-type',
      expectedScenario.finding.findingType,
    );
    await expect(page.getByTestId(`finding-${finding.id}`)).toContainText(
      expectedScenario.finding.ruleRef,
    );

    const overlapFacts = scenario.facts.filter(
      (fact) => fact.type === 'overlap',
    );
    expect(overlapFacts.length > 0).toBe(expectedScenario.overlap);
    await expect(page.locator('[data-fact-type="overlap"]')).toHaveCount(
      expectedScenario.overlap ? 1 : 0,
    );

    if (expectedScenario.slug === 'windward-leeward') {
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
