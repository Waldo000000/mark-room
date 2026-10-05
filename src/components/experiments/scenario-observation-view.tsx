import type { ScenarioObservations } from '@/src/domain/reasoning-experiment/scenario-observations';

export function ScenarioObservationView({
  observations,
}: {
  observations: ScenarioObservations;
}) {
  const label = (id: string) =>
    observations.boats.find((boat) => boat.id === id)?.label ?? id;
  return (
    <section
      aria-label="Derived observations"
      className="mt-5 rounded-lg border border-border bg-card p-4"
    >
      <h2 className="text-xl font-semibold">
        What the current input establishes
      </h2>
      <ul className="mt-3 space-y-2">
        {observations.boats.map((boat) => (
          <li key={boat.id}>
            {boat.label}: authored {boat.tack} tack; heading{' '}
            {boat.headingDegrees}°.
          </li>
        ))}
      </ul>
      <ul className="mt-3 space-y-2" data-testid="observed-pairs">
        {observations.pairs.map((pair) => (
          <li key={pair.boatIds.join('/')}>
            {pair.boatIds.map(label).join(' / ')}:{' '}
            {pair.oppositeTacks ? 'opposite' : 'same'} tacks; centers{' '}
            {pair.centerSeparation.toFixed(3)} hull lengths apart.
          </li>
        ))}
      </ul>
      {observations.pairs.length === 0 && (
        <p className="mt-3">Add a second boat to compare a pair.</p>
      )}
      {observations.hails.length > 0 && (
        <div className="mt-4" data-testid="observed-hails">
          <h3 className="font-semibold">Recorded hails at this position</h3>
          <ul className="mt-2 space-y-2">
            {observations.hails.map((hail) => (
              <li key={hail.id}>
                {label(hail.boatId)}: “{hail.message}”
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted-foreground">
            Recorded input only. Who heard the hail, whether it met hailing
            conditions and who must respond remain unestablished.
          </p>
        </div>
      )}
      <h3 className="mt-4 font-semibold">Change from the previous keyframe</h3>
      {observations.changes.length === 0 ? (
        <p className="mt-2">There is no previous keyframe.</p>
      ) : (
        <ul className="mt-2 space-y-3">
          {observations.changes.map((change) => (
            <li key={change.boatId}>
              <p>
                {label(change.boatId)}: endpoint heading difference{' '}
                {change.headingDifference}°; displacement{' '}
                {change.displacement.toFixed(3)} hull lengths.
              </p>
              <p
                className="mt-1 text-sm"
                data-testid={`displacement-rate-${change.boatId}`}
              >
                {change.displacementRate === null
                  ? 'Time-dependent rate unresolved: no incident duration supplied.'
                  : `Conditional on ${change.assumedSeconds} s per interval: displacement / duration = ${change.displacementRate.toFixed(3)} hull lengths/s.`}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm text-muted-foreground">
        Center separation is not hull clearance. Endpoint heading difference is
        not a reconstructed turn. Displacement / duration is not path speed.
        These observations do not establish overlap, contact, keeping clear or
        legal room.
      </p>
    </section>
  );
}
