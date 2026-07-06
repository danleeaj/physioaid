"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ChairStandScreen } from "@/components/assessment/screens/ChairStandScreen";
import { FloorRisingScreen } from "@/components/assessment/screens/FloorRisingScreen";
import { GaitScreen } from "@/components/assessment/screens/GaitScreen";
import { QuestionnaireScreen } from "@/components/assessment/screens/QuestionnaireScreen";
import type { AssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { TopBar } from "@/components/layout/TopBar";
import { shellCopy } from "@/components/layout/copy";
import { isRecordedMetric } from "@/lib/assessment/session-draft";
import type { TestId } from "@/types/assessment";

/**
 * Thin host for a single test opened from the hub. Back always returns to
 * the hub — the draft persists, so nothing is lost. Physical tests keep
 * their existing 3-phase screens; the questionnaire steps question by
 * question with its own footer.
 */
export function TestScreen({
  flow,
  testId,
  onBack,
}: {
  flow: AssessmentFlow;
  testId: TestId;
  onBack: () => void;
}) {
  const { t, lang } = useLanguage();
  const title = shellCopy[lang].hub.tests[testId];

  if (testId === "self_confidence") {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar backLabel={t("nav.back")} onBack={onBack} title={title} />
        <div className="app-content flex-1">
          {flow.questionnaire && (
            <QuestionnaireScreen
              questionIndex={flow.questionIndex}
              questionnaire={flow.questionnaire}
              setQuestionnaire={flow.setQuestionnaire}
            />
          )}
        </div>
        <footer className="flow-footer">
          <div className="flex items-center gap-3">
            <button
              className="link-action shrink-0"
              onClick={flow.backQuestion}
              type="button"
            >
              <ArrowLeft aria-hidden size={18} />
              {t("nav.back")}
            </button>
            <button
              className="primary-action w-full flex-1"
              onClick={flow.advanceQuestion}
              type="button"
            >
              {t("nav.next")} <ArrowRight aria-hidden size={22} />
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // Physical tests — a record (any status, incl. stopped/skipped) unlocks
  // the "Done — back to hub" action. Demo-injected placeholders count only
  // after the explicit demo-mode sample load.
  const metric =
    testId === "sit_to_stand"
      ? flow.draft.chairStand
      : testId === "walk"
        ? flow.draft.motion
        : flow.draft.floorRising;
  const hasRecord = isRecordedMetric(metric, flow.draft.demoLoaded);
  const nextTestId = flow.nextTestAfter(testId);

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar backLabel={t("nav.back")} onBack={onBack} title={title} />
      <div className="app-content flex-1">
        {testId === "sit_to_stand" && <ChairStandScreen flow={flow} />}
        {testId === "walk" && <GaitScreen flow={flow} />}
        {testId === "floor_rising" && <FloorRisingScreen flow={flow} />}
      </div>
      {hasRecord && (
        <footer className="flow-footer">
          <div className="flex items-center gap-3">
            <button
              className="link-action shrink-0"
              onClick={onBack}
              type="button"
            >
              {shellCopy[lang].test.pause}
            </button>
            <button
              className="primary-action w-full flex-1"
              onClick={() => flow.continueFromTest(testId)}
              type="button"
            >
              <Check aria-hidden size={22} />
              {nextTestId ? shellCopy[lang].test.continueToNext : shellCopy[lang].test.doneBackToHub}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
