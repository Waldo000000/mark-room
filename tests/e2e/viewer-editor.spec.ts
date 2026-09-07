import { expect, test } from '@playwright/test';
import portStarboard from '../../corpus/training-examples/port-starboard.json' with { type: 'json' };

const draftKey = 'mark-room.editor.scenario-draft.v1';

test('consumes an incoming request when saved draft JSON is malformed', async ({
  page,
}) => {
  await page.addInitScript((key) => localStorage.setItem(key, '{'), draftKey);
  await page.goto('/editor?scenario=port-starboard&position=position-2');
  await expect(page).toHaveURL('/editor');
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-2',
  );
  expect(
    JSON.parse((await page.getByTestId('editor-scenario-json').textContent())!),
  ).toEqual(portStarboard.scenario);
});

test('reopens an unchanged source draft at the newly viewed position', async ({
  page,
}) => {
  await page.goto('/editor?scenario=port-starboard&position=position-1');
  await expect(page).toHaveURL('/editor');
  await page.goto('/scenarios/port-starboard?position=position-2');
  await page.getByRole('link', { name: 'Edit scenario', exact: true }).click();
  await expect(page).toHaveURL('/editor');
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-2',
  );
  await expect(
    page.getByRole('button', { name: 'Replace saved draft', exact: true }),
  ).toHaveCount(0);
});

for (const mode of ['', '&mode=quiz', '&mode=quiz&question=rule']) {
  test(`opens the viewed scenario at its selected keyframe ${mode || 'browse'}`, async ({
    page,
  }) => {
    await page.goto(`/scenarios/port-starboard?position=position-2${mode}`);
    await page
      .getByRole('link', { name: 'Edit scenario', exact: true })
      .click();
    await expect(page).toHaveURL('/editor');
    await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
      'data-active-keyframe-id',
      'position-2',
    );
    const data = JSON.parse(
      (await page.getByTestId('editor-scenario-json').textContent())!,
    );
    expect(data).toEqual(portStarboard.scenario);
    await page.getByTestId('scenario-title-input').fill('My edited scenario');
    await page.reload();
    await expect(page.getByTestId('scenario-title-input')).toHaveValue(
      'My edited scenario',
    );
    await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
      'data-active-keyframe-id',
      'position-2',
    );
  });
}

test('keeps an existing draft until replacement is explicitly chosen', async ({
  page,
}) => {
  await page.goto('/editor');
  await page.getByTestId('scenario-title-input').fill('Keep my draft');
  const oldDraft = JSON.parse(
    (await page.getByTestId('editor-scenario-json').textContent())!,
  );
  await page.goto('/scenarios/port-starboard?position=position-2');
  await page.getByRole('link', { name: 'Edit scenario', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Replace saved draft', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).scenario,
      draftKey,
    ),
  ).toEqual(oldDraft);
  await page
    .getByRole('button', { name: 'Keep saved draft', exact: true })
    .click();
  await expect(page).toHaveURL('/editor');
  await expect(page.getByTestId('scenario-title-input')).toHaveValue(
    'Keep my draft',
  );
  await page.reload();
  await expect(page.getByTestId('scenario-title-input')).toHaveValue(
    'Keep my draft',
  );

  await page.goto('/scenarios/port-starboard?position=position-2&mode=quiz');
  await page.getByRole('link', { name: 'Edit scenario', exact: true }).click();
  await page
    .getByRole('button', { name: 'Replace saved draft', exact: true })
    .click();
  await expect(page).toHaveURL('/editor');
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-2',
  );
  expect(
    JSON.parse((await page.getByTestId('editor-scenario-json').textContent())!),
  ).toEqual(portStarboard.scenario);
  await page.reload();
  await expect
    .poll(async () =>
      JSON.parse(
        (await page.getByTestId('editor-scenario-json').textContent())!,
      ),
    )
    .toEqual(portStarboard.scenario);
});

test('protects edits even when the incoming scenario has the same ID', async ({
  page,
}) => {
  await page.goto('/editor?scenario=port-starboard&position=position-2');
  await expect(page).toHaveURL('/editor');
  await page.getByTestId('scenario-title-input').fill('Same ID, local changes');
  await page.goto('/scenarios/port-starboard');
  await page.getByRole('link', { name: 'Edit scenario', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Keep saved draft', exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('scenario-title-input')).toHaveValue(
    'Same ID, local changes',
  );
});

test('rejects unknown scenarios and falls back from an unknown position', async ({
  page,
}) => {
  await page.goto('/editor?scenario=not-a-corpus-scenario');
  await expect(
    page.getByRole('heading', { name: '404', exact: true }),
  ).toBeVisible();
  await page.goto('/editor?scenario=port-starboard&position=missing');
  await expect(page).toHaveURL('/editor');
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-1',
  );
});
