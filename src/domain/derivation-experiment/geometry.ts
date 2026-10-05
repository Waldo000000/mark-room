import { PROFILE, type Point, type Pose } from './model';

function dot(a: Point, b: Point) {
  return a.x * b.x + a.y * b.y;
}
function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}
function cross(a: Point, b: Point) {
  return a.x * b.y - a.y * b.x;
}
function pointSegmentDistance(point: Point, a: Point, b: Point) {
  const delta = subtract(b, a);
  const lengthSquared = dot(delta, delta);
  const fraction = lengthSquared
    ? Math.max(0, Math.min(1, dot(subtract(point, a), delta) / lengthSquared))
    : 0;
  return Math.hypot(
    point.x - a.x - fraction * delta.x,
    point.y - a.y - fraction * delta.y,
  );
}

export function capsuleAxis(pose: Pose): [Point, Point] {
  const heading = (pose.heading * Math.PI) / 180;
  const halfAxis = (PROFILE.hullLength - PROFILE.hullWidth) / 2;
  const dx = Math.sin(heading) * halfAxis;
  const dy = Math.cos(heading) * halfAxis;
  return [
    { x: pose.x - dx, y: pose.y - dy },
    { x: pose.x + dx, y: pose.y + dy },
  ];
}

export function hullClearance(first: Pose, second: Pose): number {
  const [a, b] = capsuleAxis(first);
  const [c, d] = capsuleAxis(second);
  const ab = subtract(b, a);
  const cd = subtract(d, c);
  const denominator = cross(ab, cd);
  const ac = subtract(c, a);
  let distance: number;
  if (
    Math.abs(denominator) > 1e-12 &&
    cross(ac, cd) / denominator >= 0 &&
    cross(ac, cd) / denominator <= 1 &&
    cross(ac, ab) / denominator >= 0 &&
    cross(ac, ab) / denominator <= 1
  ) {
    distance = 0;
  } else {
    distance = Math.min(
      pointSegmentDistance(a, c, d),
      pointSegmentDistance(b, c, d),
      pointSegmentDistance(c, a, b),
      pointSegmentDistance(d, a, b),
    );
  }
  return distance - PROFILE.hullWidth;
}
