import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

import AppShell from '../layouts/AppShell';
import QuestionStepper, { type StepDefinition } from '../components/clinicalContext/QuestionStepper';
import QuestionnaireProgress from '../components/clinicalContext/QuestionnaireProgress';
import QuestionSection from '../components/clinicalContext/QuestionSection';
import ReviewAnswers from '../components/clinicalContext/ReviewAnswers';

import { ecgService } from '../services/ecgService';
import { extractErrorMessage } from '../utils/errorUtils';
import {
  getQuestionnaire,
  saveDraft,
  loadDraft,
  clearDraft,
  submitClinicalContext,
} from '../services/clinicalContextService';

import type { ECGAnalysis } from '../types/ecg';
import type { AnswerValue, ClinicalContext, QuestionCategory, QuestionnaireDefinition } from '../types/clinicalContext';

const STEPS: StepDefinition[] = [
  { key: 'symptoms', label: 'Symptoms' },
  { key: 'riskFactors', label: 'Risk Factors' },
  { key: 'vitals', label: 'Vitals' },
  { key: 'review', label: 'Review' },
];

const STEP_DESCRIPTIONS: Record<QuestionCategory, string> = {
  symptoms: 'Tap the option that best matches what the patient is experiencing.',
  riskFactors: 'Known conditions or history that may be relevant to this rhythm.',
  vitals: 'Recent or current vital-sign observations, if known.',
};

const CATEGORY_BY_INDEX: QuestionCategory[] = ['symptoms', 'riskFactors', 'vitals'];

function buildClinicalContext(
  definition: QuestionnaireDefinition,
  answers: Record<string, AnswerValue>
): ClinicalContext {
  const context: ClinicalContext = { symptoms: {}, riskFactors: {}, vitals: {} };
  definition.questions.forEach((question) => {
    const value = answers[question.key];
    if (value === 'unknown' || value === undefined) return;
    context[question.category][question.key] = value === 'yes';
  });
  return context;
}

export default function ClinicalQuestionnairePage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState<ECGAnalysis | null>(null);
  const [definition, setDefinition] = useState<QuestionnaireDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [noPredictions, setNoPredictions] = useState(false);

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; });

  useEffect(() => {
    if (!analysisId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      setNoPredictions(false);
      try {
        const ecg = await ecgService.getAnalysis(analysisId);
        if (cancelled) return;

        const topPredictions = ecg.analysisResult?.topPredictions ?? [];
        if (topPredictions.length === 0) {
          setAnalysis(ecg);
          setNoPredictions(true);
          return;
        }

        const built = getQuestionnaire(topPredictions);
        setAnalysis(ecg);
        setDefinition(built);

        const draft = loadDraft(analysisId);
        if (draft && Object.keys(draft.answers).length > 0) {
          setAnswers(draft.answers);
          toast.success('Draft restored', { icon: '📋' });
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setLoadError(extractErrorMessage(err, 'Failed to load clinical context questionnaire'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [analysisId]);

  const handleAnswer = useCallback((key: string, value: AnswerValue) => {
    if (!analysisId) return;
    setAnswers((prev) => {
      const next = { ...prev, [key]: value };
      saveDraft({ analysisId, answers: next, updatedAt: new Date().toISOString() });
      return next;
    });
  }, [analysisId]);

  const goToStep = useCallback((index: number) => {
    setStepIndex(Math.max(0, Math.min(index, STEPS.length - 1)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAutoAdvance = useCallback(() => {
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!analysisId || !definition) return;
    setSubmitting(true);
    try {
      const clinicalContext = buildClinicalContext(definition, answersRef.current);
      await submitClinicalContext({
        analysisId,
        topRhythms: definition.topRhythms,
        clinicalContext,
      });
      clearDraft(analysisId);
      toast.success('Clinical context submitted');
      navigate(`/clinical-dashboard/${analysisId}`);
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Submission failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }, [analysisId, definition, navigate]);

  const totalQuestions = definition?.questions.length ?? 0;
  const answeredCount = useMemo(
    () => (definition ? definition.questions.filter((q) => answers[q.key] !== undefined).length : 0),
    [definition, answers]
  );

  if (loading) {
    return (
      <AppShell title="Clinical Context">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading clinical context questionnaire…</p>
        </div>
      </AppShell>
    );
  }

  if (loadError || !analysis) {
    return (
      <AppShell title="Clinical Context">
        <div className="max-w-md mx-auto mt-10 bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Failed to load questionnaire</h3>
          <p className="text-sm text-slate-600 mb-5">{loadError ?? 'Unknown error'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  if (noPredictions || !definition) {
    return (
      <AppShell title="Clinical Context">
        <div className="max-w-md mx-auto mt-10 bg-white border border-amber-200 rounded-xl p-6 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No predictions available</h3>
          <p className="text-sm text-slate-600 mb-5">
            This analysis doesn't have any rhythm predictions yet, so a clinical context questionnaire
            can't be generated.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/diagnosisdetail/${analysisId}`)}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            Back to Diagnosis
          </button>
        </div>
      </AppShell>
    );
  }

  const isReviewStep = stepIndex === STEPS.length - 1;
  const currentCategory = CATEGORY_BY_INDEX[stepIndex];

  return (
    <AppShell title="Clinical Context">
      <div className="max-w-3xl mx-auto pb-10">
        <button
          type="button"
          onClick={() => navigate(`/diagnosisdetail/${analysisId}`)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Diagnosis
        </button>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 text-white p-5 sm:p-8 space-y-6 shadow-xl">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-800/40 rounded-full px-4 py-1.5 text-xs text-blue-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
              Based on top predictions:&nbsp;
              {definition.topRhythms.map((p) => p.rhythm.replace(/_/g, ' ')).join(' · ')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Clinical Context Questionnaire</h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">
              A short set of questions tailored to the AI's top rhythm predictions. Answer what you
              can — nothing here is required, and you can submit at any time.
            </p>
          </div>

          <QuestionStepper steps={STEPS} currentIndex={stepIndex} onStepClick={goToStep} />

          {!isReviewStep && (
            <QuestionnaireProgress answered={answeredCount} total={totalQuestions} coverage={definition.coverage} />
          )}

          {isReviewStep ? (
            <ReviewAnswers
              categories={definition.categories}
              answers={answers}
              onEdit={(category) => goToStep(CATEGORY_BY_INDEX.indexOf(category))}
              onSubmit={handleSubmit}
              onCompleteWithoutAnswers={handleSubmit}
              submitting={submitting}
            />
          ) : (
            <QuestionSection
              title={STEPS[stepIndex].label}
              description={STEP_DESCRIPTIONS[currentCategory]}
              questions={definition.categories[currentCategory]}
              answers={answers}
              onAnswer={handleAnswer}
              onSkipSection={handleAutoAdvance}
              onAutoAdvance={handleAutoAdvance}
            />
          )}

          {!isReviewStep && (
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => goToStep(stepIndex - 1)}
                disabled={stepIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-700 text-sm font-medium text-gray-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => goToStep(stepIndex + 1)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {stepIndex === STEPS.length - 2 ? 'Review Answers' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
