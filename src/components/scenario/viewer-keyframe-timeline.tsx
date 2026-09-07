'use client';

import Link from 'next/link';
import { startTransition, useOptimistic } from 'react';
import { useRouter } from 'next/navigation';

import {
  KeyframeScrubber,
  type KeyframeScrubberItem,
} from '@/src/components/scenario/keyframe-scrubber';

type ViewerKeyframeTimelineProps = {
  keyframes: KeyframeScrubberItem[];
  quizMode: boolean;
  quizQuestionQuery: string;
  scenarioSlug: string;
  selectedKeyframeId: string;
};

export function ViewerKeyframeTimeline({
  keyframes,
  quizMode,
  quizQuestionQuery,
  scenarioSlug,
  selectedKeyframeId,
}: ViewerKeyframeTimelineProps) {
  const router = useRouter();
  const [optimisticKeyframeId, setOptimisticKeyframeId] =
    useOptimistic(selectedKeyframeId);

  function hrefFor(keyframeId: string) {
    return `/scenarios/${scenarioSlug}?position=${encodeURIComponent(keyframeId)}${quizMode ? `&mode=quiz${quizQuestionQuery}` : ''}`;
  }

  function selectKeyframe(keyframeId: string) {
    startTransition(() => {
      setOptimisticKeyframeId(keyframeId);
      router.replace(hrefFor(keyframeId), { scroll: false });
    });
  }

  return (
    <nav aria-label="Scenario position" className="mb-5">
      <p className="text-sm font-semibold uppercase text-muted-foreground">
        Position
      </p>
      <div className="mt-2">
        <KeyframeScrubber
          activeKeyframeId={optimisticKeyframeId}
          keyframes={keyframes}
          onSelect={selectKeyframe}
        />
      </div>
      <div
        className="mt-2 flex gap-2 overflow-x-auto pb-1"
        data-testid="position-selector"
      >
        {keyframes.map((keyframe) => {
          const selected = keyframe.id === optimisticKeyframeId;

          return (
            <Link
              key={keyframe.id}
              aria-current={selected ? 'step' : undefined}
              className={`inline-flex min-h-11 min-w-24 shrink-0 items-center justify-center rounded-sm border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 ${
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              }`}
              href={hrefFor(keyframe.id)}
              scroll={false}
            >
              {keyframe.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
