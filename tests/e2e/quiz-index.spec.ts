import { expect, test } from '@playwright/test';

test('discovers an eligible keep-clear question from the home screen', async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await page.goto('/');
  await page.getByRole('link', { name: 'Practice questions' }).click();

  await expect(page).toHaveURL('/quiz');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Practice questions' }),
  ).toBeVisible();
  const questions = page.getByRole('region', {
    name: 'Available keep-clear questions',
  });
  await expect(questions.getByRole('article')).toHaveCount(4);
  await expect(questions).not.toContainText('must keep clear of');

  const positionOne = questions
    .getByRole('article')
    .filter({ hasText: 'Port meets starboard' })
    .filter({ hasText: 'Position 1' });
  await positionOne.getByRole('link', { name: 'Start question' }).click();

  await expect(page).toHaveURL(
    '/scenarios/port-starboard?position=position-1&mode=quiz',
  );
  await page.getByRole('radio', { name: 'Blue' }).check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByTestId('quiz-feedback')).toContainText('Not quite');
  await page.getByRole('link', { name: 'Back to practice questions' }).click();

  await expect(page).toHaveURL('/quiz');
  await expect(questions.getByRole('article')).toHaveCount(4);
  await expect(page.locator('html')).toHaveJSProperty(
    'scrollWidth',
    await page.locator('html').evaluate((element) => element.clientWidth),
  );
  expect(runtimeErrors).toEqual([]);
});

test('discovers and scores an applicable-rule question without revealing its answer', async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await page.goto('/quiz');

  const questions = page.getByRole('region', {
    name: 'Available rule questions',
  });
  await expect(questions.getByRole('article')).toHaveCount(4);
  await expect(questions).not.toContainText('RRS 10');
  await expect(questions).not.toContainText('RRS 11');

  const positionOne = questions
    .getByRole('article')
    .filter({ hasText: 'Port meets starboard' })
    .filter({ hasText: 'Position 1' });
  await positionOne.getByRole('link', { name: 'Start rule question' }).click();

  await expect(page).toHaveURL(
    '/scenarios/port-starboard?position=position-1&mode=quiz&question=rule',
  );
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Which rule requires Yellow to keep clear at Position 1?',
    }),
  ).toBeVisible();
  await expect(page.getByTestId('ruling-statements')).toBeHidden();
  await expect(page.getByTestId('rulings-json')).toBeHidden();

  await page.getByRole('radio', { name: 'RRS 11' }).check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByTestId('rule-quiz-feedback')).toHaveAttribute(
    'data-correct',
    'false',
  );
  await expect(page.getByTestId('rule-quiz-feedback')).toContainText(
    'RRS 10 requires Yellow to keep clear of Blue.',
  );

  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('radio', { name: 'RRS 10' }).check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByTestId('rule-quiz-feedback')).toHaveAttribute(
    'data-correct',
    'true',
  );
  await expect(
    page.getByRole('link', { name: 'Browse referenced rules' }),
  ).toHaveAttribute('href', '/rules');
  await expect(page.locator('html')).toHaveJSProperty(
    'scrollWidth',
    await page.locator('html').evaluate((element) => element.clientWidth),
  );
  expect(runtimeErrors).toEqual([]);
});
