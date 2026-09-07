import { expect, test } from '@playwright/test';

test('keeps slider and label synchronized through history after reselecting a position', async ({
  page,
}) => {
  await page.goto('/scenarios/port-starboard?position=position-2');
  const first = page
    .getByTestId('position-selector')
    .getByRole('link', { name: 'Position 1', exact: true });
  await first.click();
  await expect(page.getByTestId('keyframe-slider')).toHaveValue('1');
  await first.click();
  await page.goBack();
  if (new URL(page.url()).searchParams.get('position') === 'position-1')
    await page.goBack();
  await expect(page).toHaveURL('/scenarios/port-starboard?position=position-2');
  await expect(page.getByTestId('keyframe-slider')).toHaveValue('2');
  await expect(page.getByTestId('active-keyframe-label')).toContainText(
    'Position 2',
  );
  await page.goForward();
  await expect(page.getByTestId('keyframe-slider')).toHaveValue('1');
});

for (const query of ['', '&mode=quiz', '&mode=quiz&question=rule']) {
  test(`scrubs viewer keyframes with keyboard while preserving scroll and query ${query || 'browse'}`, async ({
    page,
  }) => {
    await page.goto(`/scenarios/port-starboard?position=position-1${query}`);
    const slider = page.getByTestId('keyframe-slider');
    await expect(slider).toHaveValue('1');
    await slider.focus();
    await page.evaluate(() => window.scrollTo(0, 100));
    const scrollBefore = await page.evaluate(() => scrollY);
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(
      `/scenarios/port-starboard?position=position-2${query}`,
    );
    await expect(slider).toHaveValue('2');
    await expect(slider).toHaveAttribute('aria-valuetext', /Position 2/);
    await expect(page.getByTestId('active-keyframe-label')).toContainText(
      'Position 2',
    );
    await expect(page.getByTestId('scenario-diagram')).toHaveAttribute(
      'data-keyframe-id',
      'position-2',
    );
    await expect(page.getByTestId('situation-moment')).toHaveAttribute(
      'data-moment-id',
      'position-2',
    );
    expect(
      Math.abs((await page.evaluate(() => scrollY)) - scrollBefore),
    ).toBeLessThanOrEqual(1);
    await page
      .getByTestId('position-selector')
      .getByRole('link', { name: 'Position 1', exact: true })
      .click();
    await expect(page).toHaveURL(
      `/scenarios/port-starboard?position=position-1${query}`,
    );
    await expect(slider).toHaveValue('1');
    expect(
      Math.abs((await page.evaluate(() => scrollY)) - scrollBefore),
    ).toBeLessThanOrEqual(1);
  });
}

test('supports pointer and native touch selection on the viewer scrubber', async ({
  page,
  context,
}) => {
  await page.goto(
    '/scenarios/leeward-mark-clear-ahead?position=position-1&mode=quiz&question=mark-room',
  );
  const slider = page.getByTestId('keyframe-slider');
  await slider.scrollIntoViewIfNeeded();
  const bounds = await slider.boundingBox();
  if (!bounds) throw new Error('Missing slider bounds');
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  await page.mouse.click(
    bounds.x + bounds.width - 10,
    bounds.y + bounds.height / 2,
  );
  await expect(slider).toHaveValue('2');
  await expect(page.getByTestId('active-keyframe-label')).toContainText(
    'Later leeward inside overlap',
  );
  await expect(page).toHaveURL(
    '/scenarios/leeward-mark-clear-ahead?position=position-2&mode=quiz&question=mark-room',
  );
  const touchBounds = await slider.boundingBox();
  if (!touchBounds) throw new Error('Missing slider bounds');
  const session = await context.newCDPSession(page);
  const y = touchBounds.y + touchBounds.height / 2;
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: touchBounds.x + touchBounds.width - 10, y }],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: touchBounds.x + 10, y }],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await expect(page).toHaveURL(
    '/scenarios/leeward-mark-clear-ahead?position=position-1&mode=quiz&question=mark-room',
  );
  await expect(slider).toHaveValue('1');
  await expect(page.getByTestId('active-keyframe-label')).toContainText(
    'First boat reaches the zone',
  );
  await session.detach();
});

test('uses the same labelled scrubber for editor keyframes', async ({
  page,
}) => {
  await page.goto('/editor');
  const slider = page.getByTestId('keyframe-slider');
  await page.getByTestId('keyframe-label-input').fill('Approach');
  await expect(page.getByTestId('active-keyframe-label')).toContainText(
    'Approach',
  );
  await slider.focus();
  await page.keyboard.press('End');
  await expect(slider).toHaveValue('2');
  await expect(page.getByTestId('editor-diagram')).toHaveAttribute(
    'data-active-keyframe-id',
    'position-2',
  );
  await page.getByTestId('keyframe-label-input').fill('Rounding');
  await expect(page.getByTestId('active-keyframe-label')).toContainText(
    'Rounding',
  );
  await expect(slider).toHaveAttribute('aria-valuetext', /Rounding/);
  await page.getByTestId('delete-keyframe').click();
  await expect(slider).toHaveAttribute('max', '1');
  await expect(slider).toHaveValue('1');
  await expect(page.getByTestId('active-keyframe-label')).toContainText(
    'Approach',
  );
});
