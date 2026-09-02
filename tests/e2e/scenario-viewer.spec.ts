import { expect, test } from '@playwright/test';

import { deriveSailPresentation } from '../../src/components/scenario/boat-glyph';
import type { Ruling } from '../../src/domain/ruling/schema';
import { inferTackFromHeading } from '../../src/domain/scenario/geometry';
import type { Scenario } from '../../src/domain/scenario/schema';
import type { Situation } from '../../src/domain/situation/schema';
import type { TrainingExample } from '../../src/domain/training-example/schema';

test('browses the validated corpus and opens a scenario', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Browse scenarios' }).click();

  await expect(page).toHaveURL('/scenarios');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Racing rules scenarios' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Port meets starboard' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Clear ahead on the same tack',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Clear ahead at a leeward mark',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Windward meets leeward' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Overlapped boats near a mark',
    }),
  ).toBeVisible();
  await expect(page.getByText('Unverified transcription')).toHaveCount(6);
  const availableScenarios = page.getByRole('region', {
    name: 'Available scenarios',
  });
  await expect(
    availableScenarios.getByText('RRS 10', { exact: true }),
  ).toBeVisible();
  await expect(
    availableScenarios.getByRole('article').filter({ hasText: 'RRS 11' }),
  ).toHaveCount(4);

  await page
    .getByRole('article')
    .filter({ hasText: 'Port meets starboard' })
    .getByRole('link', { name: 'Open scenario' })
    .click();

  await expect(page).toHaveURL('/scenarios/port-starboard');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Port meets starboard' }),
  ).toBeVisible();
});

test('derives mark-zone geometry from the mark and rules context', async ({
  page,
}) => {
  await page.goto('/scenarios/windward-mark-zone');

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Overlapped boats near a mark',
    }),
  ).toBeVisible();

  const scenario = JSON.parse(
    (await page.getByTestId('scenario-json').textContent()) ?? '',
  ) as Scenario;
  const situation = JSON.parse(
    (await page.getByTestId('situation-json').textContent()) ?? '',
  ) as Situation;
  const keyframe = scenario.keyframes[0];
  const moment = situation.moments[0];
  const mark = scenario.courseFeatures.find(
    (feature) => feature.type === 'mark' && feature.id === 'windward-mark',
  );

  expect(mark?.type).toBe('mark');
  expect(scenario.courseFeatures.map((feature) => feature.type)).not.toContain(
    'zone',
  );
  if (!mark || mark.type !== 'mark') {
    throw new Error('Expected windward mark feature');
  }

  const zoneRadius = 4;

  const markGlyph = page.getByTestId(`mark-${mark.id}`);
  const zoneGlyph = page.getByTestId(`zone-${mark.id}`);
  const markScreenY = scenario.sailingArea.height - mark.position.y;
  const zoneScreenY = markScreenY;

  await expect(markGlyph).toContainText('Windward mark');
  await expect(markGlyph).toHaveAttribute(
    'data-position-x',
    String(mark.position.x),
  );
  await expect(markGlyph).toHaveAttribute(
    'data-position-y',
    String(mark.position.y),
  );
  await expect(markGlyph.locator('circle')).toHaveAttribute(
    'cx',
    String(mark.position.x),
  );
  await expect(markGlyph.locator('circle')).toHaveAttribute(
    'cy',
    String(markScreenY),
  );
  await expect(markGlyph.locator('circle')).toHaveAttribute(
    'r',
    String(mark.radius),
  );

  await expect(zoneGlyph).toContainText('4 hull length zone');
  await expect(zoneGlyph).toHaveAttribute('data-mark-id', mark.id);
  await expect(zoneGlyph).toHaveAttribute(
    'data-center-x',
    String(mark.position.x),
  );
  await expect(zoneGlyph).toHaveAttribute(
    'data-center-y',
    String(mark.position.y),
  );
  await expect(zoneGlyph).toHaveAttribute(
    'data-radius-hull-lengths',
    String(zoneRadius),
  );
  await expect(zoneGlyph.locator('circle')).toHaveAttribute(
    'cx',
    String(mark.position.x),
  );
  await expect(zoneGlyph.locator('circle')).toHaveAttribute(
    'cy',
    String(zoneScreenY),
  );
  await expect(zoneGlyph.locator('circle')).toHaveAttribute(
    'r',
    String(zoneRadius),
  );
  const diagramBox = await page.getByTestId('scenario-diagram').boundingBox();
  const zoneLabelBox = await zoneGlyph.locator('text').boundingBox();
  expect(diagramBox).not.toBeNull();
  expect(zoneLabelBox).not.toBeNull();
  if (!diagramBox || !zoneLabelBox) {
    throw new Error('Expected diagram and visible zone label bounds');
  }
  expect(zoneLabelBox.y).toBeGreaterThanOrEqual(diagramBox.y);
  expect(zoneLabelBox.y + zoneLabelBox.height).toBeLessThanOrEqual(
    diagramBox.y + diagramBox.height,
  );

  for (const state of keyframe.boatStates) {
    const distanceFromMark = Math.hypot(
      state.position.x - mark.position.x,
      state.position.y - mark.position.y,
    );
    const situationState = moment.boatStates.find(
      (candidate) => candidate.boatId === state.boatId,
    );

    expect(distanceFromMark).toBeLessThanOrEqual(zoneRadius);
    expect(situationState?.inZoneOfMarks).toContain(mark.id);
  }

  await expect(page.getByTestId('hull-length-scale')).toContainText(
    '1 hull length',
  );
  await expect(page.locator('html')).toHaveJSProperty(
    'scrollWidth',
    await page.locator('html').evaluate((element) => element.clientWidth),
  );
  await expect(page.getByTestId('scenario-diagram')).toHaveScreenshot(
    'windward-mark-zone-diagram.png',
    { maxDiffPixelRatio: 0.005 },
  );
});

test('shows the windward boat keeping clear under Rule 11', async ({
  page,
}) => {
  await page.goto('/scenarios/windward-leeward');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Windward meets leeward' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Rulings at Position 1' }),
  ).toBeVisible();
  await expect(page.getByTestId('ruling-obligation')).toContainText(
    'Red must keep clear of Blue.',
  );
  await expect(page.getByTestId('ruling-obligation')).toContainText('RRS 11');
  await expect(page.getByTestId('no-outcomes')).toHaveText(
    'No outcomes recorded at this position.',
  );

  const scenario = JSON.parse(
    (await page.getByTestId('scenario-json').textContent()) ?? '',
  ) as Scenario;
  const situation = JSON.parse(
    (await page.getByTestId('situation-json').textContent()) ?? '',
  ) as Situation;
  const rulings = JSON.parse(
    (await page.getByTestId('rulings-json').textContent()) ?? '',
  ) as Ruling;
  const redState = scenario.keyframes[0].boatStates.find(
    (state) => state.boatId === 'red',
  );
  const blueState = scenario.keyframes[0].boatStates.find(
    (state) => state.boatId === 'blue',
  );

  expect(redState?.position.y).toBeGreaterThan(blueState?.position.y ?? 0);
  expect(redState?.headingDegrees).toBe(blueState?.headingDegrees);
  expect(redState?.tack).toBe('starboard');
  expect(blueState?.tack).toBe('starboard');
  expect(situation.moments[0].relationships).toContainEqual({
    type: 'windward-leeward',
    windwardBoatId: 'red',
    leewardBoatId: 'blue',
  });
  expect(situation.moments[0].relationships).toContainEqual({
    type: 'relative-position',
    subjectBoatId: 'red',
    otherBoatId: 'blue',
    relationship: 'overlapped',
  });
  expect(rulings.obligations[0]).toMatchObject({
    boatId: 'red',
    owedToBoatId: 'blue',
    ruleRefs: ['RRS 11'],
  });

  await expect(page.getByTestId('scenario-diagram')).toHaveScreenshot(
    'windward-leeward-diagram.png',
    { maxDiffPixelRatio: 0.005 },
  );
});

test('shows the clear-astern boat keeping clear under Rule 12', async ({
  page,
}) => {
  await page.goto('/scenarios/clear-ahead');

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Clear ahead on the same tack',
    }),
  ).toBeVisible();
  await expect(page.getByTestId('ruling-obligation')).toContainText(
    'Yellow must keep clear of Blue.',
  );
  await expect(page.getByTestId('ruling-obligation')).toContainText('RRS 12');

  const scenario = JSON.parse(
    (await page.getByTestId('scenario-json').textContent()) ?? '',
  ) as Scenario;
  const situation = JSON.parse(
    (await page.getByTestId('situation-json').textContent()) ?? '',
  ) as Situation;
  const rulings = JSON.parse(
    (await page.getByTestId('rulings-json').textContent()) ?? '',
  ) as Ruling;
  const [blue, yellow] = scenario.keyframes[0].boatStates;
  const headingRadians = (blue.headingDegrees * Math.PI) / 180;
  const headingVector = {
    x: Math.sin(headingRadians),
    y: Math.cos(headingRadians),
  };
  const separation = {
    x: blue.position.x - yellow.position.x,
    y: blue.position.y - yellow.position.y,
  };
  const longitudinalSeparation =
    separation.x * headingVector.x + separation.y * headingVector.y;
  const crossTrackSeparation = Math.abs(
    separation.x * headingVector.y - separation.y * headingVector.x,
  );

  expect(blue.headingDegrees).toBe(yellow.headingDegrees);
  expect(blue.tack).toBe('starboard');
  expect(yellow.tack).toBe('starboard');
  expect(longitudinalSeparation).toBeGreaterThan(1);
  expect(crossTrackSeparation).toBeLessThan(0.01);
  expect(situation.moments[0].relationships).toContainEqual({
    type: 'relative-position',
    subjectBoatId: 'blue',
    otherBoatId: 'yellow',
    relationship: 'clear-ahead',
  });
  expect(rulings.obligations).toContainEqual({
    atMoment: 'position-1',
    boatId: 'yellow',
    type: 'keep-clear',
    owedToBoatId: 'blue',
    ruleRefs: ['RRS 12'],
  });

  await expect(page.locator('html')).toHaveJSProperty(
    'scrollWidth',
    await page.locator('html').evaluate((element) => element.clientWidth),
  );
  await expect(page.getByTestId('scenario-diagram')).toHaveScreenshot(
    'clear-ahead-diagram.png',
    { maxDiffPixelRatio: 0.007 },
  );
});

test('shows an outside boat giving mark-room from first zone entry', async ({
  page,
}) => {
  await page.goto('/scenarios/leeward-mark-overlap');

  const scenario = JSON.parse(
    (await page.getByTestId('scenario-json').textContent()) ?? '',
  ) as Scenario;
  const situation = JSON.parse(
    (await page.getByTestId('situation-json').textContent()) ?? '',
  ) as Situation;
  const rulings = JSON.parse(
    (await page.getByTestId('rulings-json').textContent()) ?? '',
  ) as Ruling;
  const mark = scenario.courseFeatures.find(
    (feature) => feature.type === 'mark' && feature.id === 'leeward-mark',
  );
  if (!mark || mark.type !== 'mark') {
    throw new Error('Expected leeward mark');
  }

  expect(mark.requiredSide).toBe('port');
  await expect(page.getByTestId('mark-leeward-mark')).toContainText(
    'Leeward mark (leave to port)',
  );
  await expect(page.getByTestId('mark-position-leeward-mark')).toHaveText(
    'Blue is inside Yellow at Leeward mark.',
  );
  await expect(page.getByTestId('zone-leeward-mark')).toHaveAttribute(
    'data-radius-hull-lengths',
    '4',
  );

  const firstMoment = situation.moments[0];
  expect(firstMoment.relationships).toContainEqual({
    type: 'relative-position',
    subjectBoatId: 'blue',
    otherBoatId: 'yellow',
    relationship: 'overlapped',
  });
  expect(firstMoment.relationships).toContainEqual({
    type: 'mark-position',
    markId: 'leeward-mark',
    insideBoatId: 'blue',
    outsideBoatId: 'yellow',
  });
  expect(firstMoment.boatStates[0].inZoneOfMarks).toContain('leeward-mark');
  expect(firstMoment.boatStates[1].inZoneOfMarks).not.toContain('leeward-mark');

  const firstKeyframe = scenario.keyframes[0];
  const [blue, yellow] = firstKeyframe.boatStates;
  const bowDistance = (state: (typeof firstKeyframe.boatStates)[number]) => {
    const radians = (state.headingDegrees * Math.PI) / 180;
    const bow = {
      x: state.position.x + Math.sin(radians) * 0.5,
      y: state.position.y + Math.cos(radians) * 0.5,
    };
    return Math.hypot(bow.x - mark.position.x, bow.y - mark.position.y);
  };
  expect(bowDistance(blue)).toBeLessThanOrEqual(4);
  expect(bowDistance(yellow)).toBeGreaterThan(4);
  expect(rulings.obligations).toContainEqual({
    atMoment: 'position-1',
    boatId: 'yellow',
    type: 'give-mark-room',
    owedToBoatId: 'blue',
    ruleRefs: ['RRS 18.2(a)(1)'],
  });

  await expect(page.getByTestId('scenario-diagram')).toHaveScreenshot(
    'leeward-mark-overlap-diagram.png',
    { maxDiffPixelRatio: 0.007 },
  );

  await page
    .getByTestId('position-selector')
    .getByRole('link', { name: 'Approaching the mark' })
    .click();

  await expect(page.getByTestId('mark-position-leeward-mark')).toHaveText(
    'Blue is inside Yellow at Leeward mark.',
  );
  await expect(page.getByTestId('ruling-statements')).toContainText(
    'Yellow must give mark-room to Blue.',
  );
  await expect(page.getByTestId('ruling-statements')).toContainText(
    'RRS 18.2(a)(1)',
  );
  expect(situation.moments[1].relationships).toContainEqual({
    type: 'available-room',
    boatId: 'blue',
    constrainedByBoatId: 'yellow',
    purpose: 'mark-rounding',
    available: true,
  });
});

test('preserves mark-room when a clear-astern boat later overlaps', async ({
  page,
}) => {
  await page.goto('/scenarios/leeward-mark-clear-ahead');

  const scenario = JSON.parse(
    (await page.getByTestId('scenario-json').textContent()) ?? '',
  ) as Scenario;
  const situation = JSON.parse(
    (await page.getByTestId('situation-json').textContent()) ?? '',
  ) as Situation;
  const rulings = JSON.parse(
    (await page.getByTestId('rulings-json').textContent()) ?? '',
  ) as Ruling;
  const mark = scenario.courseFeatures.find(
    (feature) => feature.type === 'mark' && feature.id === 'leeward-mark',
  );
  if (!mark || mark.type !== 'mark') {
    throw new Error('Expected leeward mark');
  }

  expect(mark.requiredSide).toBe('port');
  await expect(page.getByTestId('mark-leeward-mark')).toContainText(
    'Leeward mark (leave to port)',
  );
  await expect(page.getByTestId('mark-position-leeward-mark')).toHaveCount(0);
  await expect(page.getByTestId('zone-leeward-mark')).toHaveAttribute(
    'data-radius-hull-lengths',
    '4',
  );

  const firstMoment = situation.moments[0];
  expect(firstMoment.relationships).toContainEqual({
    type: 'relative-position',
    subjectBoatId: 'blue',
    otherBoatId: 'yellow',
    relationship: 'clear-ahead',
  });
  expect(firstMoment.relationships).not.toContainEqual(
    expect.objectContaining({ type: 'mark-position' }),
  );
  expect(firstMoment.boatStates[0].inZoneOfMarks).toContain('leeward-mark');
  expect(firstMoment.boatStates[1].inZoneOfMarks).not.toContain('leeward-mark');

  const firstKeyframe = scenario.keyframes[0];
  const [blue, yellow] = firstKeyframe.boatStates;
  const bowDistance = (state: (typeof firstKeyframe.boatStates)[number]) => {
    const radians = (state.headingDegrees * Math.PI) / 180;
    const bow = {
      x: state.position.x + Math.sin(radians) * 0.5,
      y: state.position.y + Math.cos(radians) * 0.5,
    };
    return Math.hypot(bow.x - mark.position.x, bow.y - mark.position.y);
  };
  expect(blue.position.y + 0.5).toBeLessThan(yellow.position.y - 0.5);
  expect(bowDistance(blue)).toBeLessThanOrEqual(4);
  expect(bowDistance(yellow)).toBeGreaterThan(4);
  expect(rulings.obligations).toEqual(
    expect.arrayContaining([
      {
        atMoment: 'position-1',
        boatId: 'yellow',
        type: 'keep-clear',
        owedToBoatId: 'blue',
        ruleRefs: ['RRS 12'],
      },
      {
        atMoment: 'position-1',
        boatId: 'yellow',
        type: 'give-mark-room',
        owedToBoatId: 'blue',
        ruleRefs: ['RRS 18.2(a)(2)'],
      },
    ]),
  );

  await expect(page.getByTestId('scenario-diagram')).toHaveScreenshot(
    'leeward-mark-clear-ahead-diagram.png',
    { maxDiffPixelRatio: 0.007 },
  );

  await page
    .getByTestId('position-selector')
    .getByRole('link', { name: 'Later overlap' })
    .click();

  await expect(page.getByTestId('mark-position-leeward-mark')).toHaveText(
    'Blue is inside Yellow at Leeward mark.',
  );
  expect(situation.moments[1].relationships).toEqual(
    expect.arrayContaining([
      {
        type: 'relative-position',
        subjectBoatId: 'blue',
        otherBoatId: 'yellow',
        relationship: 'overlapped',
      },
      {
        type: 'mark-position',
        markId: 'leeward-mark',
        insideBoatId: 'blue',
        outsideBoatId: 'yellow',
      },
    ]),
  );
  await expect(page.getByTestId('ruling-statements')).toContainText(
    'Yellow must give mark-room to Blue.',
  );
  await expect(page.getByTestId('ruling-statements')).toContainText(
    'RRS 18.2(a)(2)',
  );
  expect(rulings.obligations).toContainEqual({
    atMoment: 'position-2',
    boatId: 'yellow',
    type: 'give-mark-room',
    owedToBoatId: 'blue',
    ruleRefs: ['RRS 18.2(a)(2)'],
  });
});

test('scores a keep-clear answer without revealing the ruling first', async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await page.goto('/scenarios/port-starboard');
  await page.getByTestId('start-quiz').click();

  await expect(page).toHaveURL(
    '/scenarios/port-starboard?position=position-1&mode=quiz',
  );
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Which boat must keep clear at Position 1?',
    }),
  ).toBeVisible();
  await expect(page.getByTestId('ruling-statements')).toBeHidden();
  await expect(page.getByTestId('rulings-json')).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Check answer' }),
  ).toBeDisabled();

  await page.getByRole('radio', { name: 'Blue' }).check();
  await page.getByRole('button', { name: 'Check answer' }).click();

  const incorrectFeedback = page.getByTestId('quiz-feedback');
  await expect(incorrectFeedback).toHaveAttribute('data-correct', 'false');
  await expect(incorrectFeedback).toContainText('Not quite');
  await expect(incorrectFeedback).toContainText(
    'Yellow must keep clear of Blue.',
  );
  await expect(incorrectFeedback).toContainText('RRS 10');
  await expect(incorrectFeedback).toContainText(
    'On opposite tacks, identify the starboard-tack boat first',
  );
  await page.getByRole('button', { name: 'Try again' }).click();

  await expect(page.getByTestId('quiz-feedback')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'Blue' })).not.toBeChecked();
  await expect(page.getByRole('radio', { name: 'Yellow' })).not.toBeChecked();
  await expect(
    page.getByRole('button', { name: 'Check answer' }),
  ).toBeDisabled();
  await page.getByRole('radio', { name: 'Yellow' }).check();
  await page.getByRole('button', { name: 'Check answer' }).click();

  const correctFeedback = page.getByTestId('quiz-feedback');
  await expect(correctFeedback).toHaveAttribute('data-correct', 'true');
  await expect(correctFeedback).toContainText('Correct');
  await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
  await correctFeedback
    .getByRole('link', { name: 'Review the full ruling' })
    .click();

  await expect(page).toHaveURL('/scenarios/port-starboard?position=position-1');
  await expect(page.getByTestId('ruling-statements')).toContainText(
    'Yellow must keep clear of Blue.',
  );
  await expect(page.locator('html')).toHaveJSProperty(
    'scrollWidth',
    await page.locator('html').evaluate((element) => element.clientWidth),
  );
  expect(runtimeErrors).toEqual([]);
});

test('switches keyframes, Situation moments, and Rulings together', async ({
  page,
}) => {
  await page.goto('/scenarios/port-starboard');

  const positionSelector = page.getByTestId('position-selector');
  const positionOne = positionSelector.getByRole('link', {
    name: 'Position 1',
  });
  const positionTwo = positionSelector.getByRole('link', {
    name: 'Position 2',
  });

  await expect(positionSelector).toBeVisible();
  await expect(positionOne).toHaveAttribute('aria-current', 'step');
  await expect(positionTwo).not.toHaveAttribute('aria-current', 'step');
  await expect(page.getByTestId('scenario-diagram')).toHaveAttribute(
    'data-keyframe-id',
    'position-1',
  );

  await positionTwo.click();

  await expect(page).toHaveURL('/scenarios/port-starboard?position=position-2');
  await expect(positionTwo).toHaveAttribute('aria-current', 'step');
  await expect(positionOne).not.toHaveAttribute('aria-current', 'step');
  await expect(page.getByTestId('scenario-diagram')).toHaveAttribute(
    'data-keyframe-id',
    'position-2',
  );
  await expect(page.getByTestId('situation-moment')).toHaveAttribute(
    'data-moment-id',
    'position-2',
  );
  await expect(page.getByTestId('ruling-statements')).toHaveAttribute(
    'data-ruling-moment-id',
    'position-2',
  );

  const scenario = JSON.parse(
    (await page.getByTestId('scenario-json').textContent()) ?? '',
  ) as Scenario;
  const selectedKeyframe = scenario.keyframes.find(
    (keyframe) => keyframe.id === 'position-2',
  );
  expect(selectedKeyframe).toBeDefined();

  for (const state of selectedKeyframe?.boatStates ?? []) {
    const screenY = scenario.sailingArea.height - state.position.y;
    await expect(
      page.getByTestId(`boat-${state.boatId}`).locator(':scope > g'),
    ).toHaveAttribute(
      'transform',
      `translate(${state.position.x} ${screenY}) rotate(${state.headingDegrees})`,
    );
  }

  await expect(page.locator('html')).toHaveJSProperty(
    'scrollWidth',
    await page.locator('html').evaluate((element) => element.clientWidth),
  );
  await expect(page.getByTestId('scenario-diagram')).toHaveScreenshot(
    'port-starboard-position-2-diagram.png',
    { maxDiffPixelRatio: 0.005 },
  );
});

test('renders Scenario, Situation, and Ruling consistently', async ({
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
  const rulingsJsonText = await page.getByTestId('rulings-json').textContent();
  const rulings = JSON.parse(rulingsJsonText ?? '') as Ruling;
  const trainingExampleJsonText = await page
    .getByTestId('training-example-json')
    .textContent();
  const trainingExample = JSON.parse(
    trainingExampleJsonText ?? '',
  ) as TrainingExample;

  expect(scenario).not.toHaveProperty('lengthUnit');
  expect(scenario).not.toHaveProperty('teachingText');
  expect(scenario).not.toHaveProperty('provenance');
  expect(scenario).not.toHaveProperty('verification');
  expect(scenario).not.toHaveProperty('prompt');
  expect(scenario).not.toHaveProperty('facts');
  expect(scenario).not.toHaveProperty('ruling');
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
  expect(trainingExample).toEqual({ scenario, situation, rulings });
  expect(Object.keys(trainingExample)).toEqual([
    'scenario',
    'situation',
    'rulings',
  ]);
  await expect(page.getByText('Situation', { exact: true })).toBeVisible();

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

  const obligation = rulings.obligations[0];
  const subject = scenario.boats.find((boat) => boat.id === obligation.boatId);
  const other = scenario.boats.find(
    (boat) => boat.id === obligation.owedToBoatId,
  );

  expect(obligation).not.toHaveProperty('id');
  expect(obligation).not.toHaveProperty('explanation');
  expect(rulings).not.toHaveProperty('conclusion');

  await expect(page.getByTestId('ruling-obligation')).toContainText(
    `${subject?.label} must keep clear of ${other?.label}.`,
  );
  await expect(page.getByTestId('ruling-obligation')).toContainText('RRS 10');
  await expect(page.getByTestId('no-outcomes')).toBeVisible();
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
