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
    page.getByRole('heading', { level: 1, name: 'Keep-clear questions' }),
  ).toBeVisible();
  const questions = page.getByRole('region', {
    name: 'Available practice questions',
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
