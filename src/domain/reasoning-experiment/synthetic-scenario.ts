import { scenarioSchema, type Scenario } from '../scenario/schema';

// Independently authored research sketch, not a Case 147 reconstruction.
export function syntheticScenario(): Scenario {
  return scenarioSchema.parse({
    schemaVersion: '0.5.0',
    id: 'synthetic-opposing-tacks',
    title: 'Synthetic opposing-tack sketch',
    context: { discipline: 'general_rrs', ruleSetVersion: '2025-2028' },
    sailingArea: { width: 12, height: 12 },
    wind: { fromDegrees: 0 },
    boats: [
      { id: 's', label: 'S' },
      { id: 'p', label: 'P' },
    ],
    keyframes: [
      {
        id: 'before',
        label: 'Before',
        boatStates: [
          {
            boatId: 's',
            position: { x: 8, y: 4 },
            headingDegrees: 300,
            tack: 'starboard',
          },
          {
            boatId: 'p',
            position: { x: 3, y: 3 },
            headingDegrees: 60,
            tack: 'port',
          },
        ],
      },
      {
        id: 'middle',
        label: 'Middle',
        boatStates: [
          {
            boatId: 's',
            position: { x: 7, y: 5 },
            headingDegrees: 315,
            tack: 'starboard',
          },
          {
            boatId: 'p',
            position: { x: 4, y: 4 },
            headingDegrees: 60,
            tack: 'port',
          },
        ],
      },
      {
        id: 'after',
        label: 'After',
        boatStates: [
          {
            boatId: 's',
            position: { x: 6, y: 6 },
            headingDegrees: 300,
            tack: 'starboard',
          },
          {
            boatId: 'p',
            position: { x: 5, y: 5 },
            headingDegrees: 60,
            tack: 'port',
          },
        ],
      },
    ],
    courseFeatures: [],
    observedEvents: [],
  });
}
