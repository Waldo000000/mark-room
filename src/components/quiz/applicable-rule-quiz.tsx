'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  scoreApplicableRuleAnswer,
  type ApplicableRuleQuizQuestion,
  type ApplicableRuleQuizResult,
} from '@/src/domain/quiz/applicable-rule';

type ApplicableRuleQuizProps = {
  question: ApplicableRuleQuizQuestion;
  reviewHref: string;
  teachingText?: string;
};

export function ApplicableRuleQuiz({
  question,
  reviewHref,
  teachingText,
}: ApplicableRuleQuizProps) {
  const [selectedRuleReference, setSelectedRuleReference] = useState('');
  const [result, setResult] = useState<ApplicableRuleQuizResult | null>(null);

  function submitAnswer() {
    if (!selectedRuleReference) return;
    setResult(scoreApplicableRuleAnswer(question, selectedRuleReference));
  }

  function retryAnswer() {
    setSelectedRuleReference('');
    setResult(null);
  }

  return (
    <section aria-labelledby="rule-question" data-testid="rule-quiz">
      <p className="text-sm font-semibold uppercase text-muted-foreground">
        Rule check
      </p>
      <h2 className="mt-2 text-xl font-semibold" id="rule-question">
        {question.prompt}
      </h2>

      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          submitAnswer();
        }}
      >
        <fieldset disabled={result !== null}>
          <legend className="text-sm leading-6 text-muted-foreground">
            Choose one rule, then check your answer.
          </legend>
          <div className="mt-3 grid gap-3">
            {question.options.map((option) => {
              const selected = selectedRuleReference === option.ruleReference;

              return (
                <label
                  className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm font-semibold transition-colors focus-within:outline-2 focus-within:outline-offset-2 ${
                    selected
                      ? 'border-primary bg-secondary text-secondary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  } ${result ? 'cursor-default' : ''}`}
                  key={option.ruleReference}
                >
                  <input
                    checked={selected}
                    className="size-5 accent-primary"
                    name="rule-answer"
                    onChange={() =>
                      setSelectedRuleReference(option.ruleReference)
                    }
                    type="radio"
                    value={option.ruleReference}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <button
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!selectedRuleReference || result !== null}
          type="submit"
        >
          Check answer
        </button>
      </form>

      {result ? (
        <div
          aria-live="polite"
          className={`mt-5 border-l-4 pl-4 ${
            result.isCorrect ? 'border-primary' : 'border-destructive'
          }`}
          data-correct={result.isCorrect}
          data-testid="rule-quiz-feedback"
        >
          <h3 className="text-base font-semibold">
            {result.isCorrect ? 'Correct' : 'Not quite'}
          </h3>
          <p className="mt-2 text-sm font-semibold leading-6">
            {result.explanation}
          </p>
          {teachingText ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {teachingText}
            </p>
          ) : null}
          {!result.isCorrect ? (
            <button
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-primary bg-background px-4 text-sm font-semibold text-primary transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
              onClick={retryAnswer}
              type="button"
            >
              Try again
            </button>
          ) : null}
          <Link
            className="mt-4 inline-block text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            href="/rules"
          >
            Browse referenced rules
          </Link>
          <Link
            className="mt-3 block text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            href={reviewHref}
          >
            Review the full ruling
          </Link>
          <Link
            className="mt-3 block text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            href="/quiz"
          >
            Back to practice questions
          </Link>
        </div>
      ) : null}
    </section>
  );
}
