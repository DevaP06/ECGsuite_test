import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, AlertTriangle, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import toast from 'react-hot-toast';

import AppShell from '../../layouts/AppShell';
import QuestionnaireRenderer from '../../components/questionnaire/QuestionnaireRenderer';
import QuestionnaireProgress from '../../components/questionnaire/QuestionnaireProgress';
import QuestionnaireSummary from '../../components/questionnaire/QuestionnaireSummary';

import { ecgService } from '../../services/ecgService';
import {
  fetchQuestionnaire,
  submitQuestionnaire,
  saveDraft,
  loadDraft,
  clearDraft,
  validateSection,
  computeCompletion,
} from '../../services/questionnaireService';
import { answersMapToArray, answersArrayToMap } from '../../types/questionnaire';
import { isDoctor } from '../../features/auth/roleUtils';

import type { ECGAnalysis } from '../../types/ecg';
import type { QuestionnaireResponse, AnswersMap, QuestionValue } from '../../types/questionnaire';

const AUTO_SAVE_INTERVAL_MS = 30_000;

export default function HistoryQuestionnairePage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const canSubmit = isDoctor();

  // ─── Data state ──────────────────────────────────────────────────────────
  const [analysis, setAnalysis] = useState<ECGAnalysis | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ─── Form state ───────────────────────────────────────────────────────────
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Stable ref so the auto-save interval captures fresh answers
  const answersRef = useRef<AnswersMap>(answers);
  useEffect(() => { answersRef.current = answers; });

  // ─── Load analysis + questionnaire schema ─────────────────────────────────
  useEffect(() => {
    if (!analysisId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [ecg, schema] = await Promise.all([
          ecgService.getAnalysis(analysisId),
          fetchQuestionnaire(analysisId),
        ]);
        if (cancelled) return;
        setAnalysis(ecg);
        setQuestionnaire(schema);

        // Restore draft if present
        const draft = loadDraft(analysisId);
        if (draft?.answers?.length) {
          setAnswers(answersArrayToMap(draft.answers));
          toast.success('Draft restored', { icon: '📋' });
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = (err as { message?: string }).message ?? 'Failed to load questionnaire';
        setLoadError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [analysisId]);

  // ─── Auto-save every 30 s ─────────────────────────────────────────────────
  useEffect(() => {
    if (!analysisId) return;
    const id = setInterval(() => {
      const draft = {
        analysisId,
        answers: answersMapToArray(answersRef.current),
        savedAt: new Date().toISOString(),
      };
      saveDraft(draft);
      setLastSaved(new Date());
    }, AUTO_SAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [analysisId]);

  // ─── Answer handler ───────────────────────────────────────────────────────
  const handleAnswer = useCallback((questionId: string, value: QuestionValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, []);

  // ─── Manual save draft ────────────────────────────────────────────────────
  const handleSaveDraft = useCallback(() => {
    if (!analysisId) return;
    saveDraft({ analysisId, answers: answersMapToArray(answers), savedAt: new Date().toISOString() });
    setLastSaved(new Date());
    toast.success('Draft saved');
  }, [analysisId, answers]);

  // ─── Section navigation ───────────────────────────────────────────────────
  const sections = questionnaire?.sections ?? [];

  const handleNext = () => {
    if (!sections.length) return;
    const currentSection = sections[currentSectionIdx];
    const sectionErrors = validateSection(currentSection.questions, answers);
    if (Object.keys(sectionErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...sectionErrors }));
      toast.error('Please answer all required fields in this section.');
      return;
    }
    if (currentSectionIdx < sections.length - 1) {
      setCurrentSectionIdx((i) => i + 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowSummary(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (showSummary) {
      setShowSummary(false);
    } else if (currentSectionIdx > 0) {
      setCurrentSectionIdx((i) => i - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJump = (idx: number) => {
    setShowSummary(false);
    setCurrentSectionIdx(idx);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!analysisId || !canSubmit) return;
    setSubmitting(true);
    try {
      await submitQuestionnaire(analysisId, { answers: answersMapToArray(answers) });
      clearDraft(analysisId);
      toast.success('Clinical history submitted successfully');
      navigate(`/clinical-dashboard/${analysisId}`);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(axErr.response?.data?.message ?? axErr.message ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Completion stats ─────────────────────────────────────────────────────
  const completion = questionnaire ? computeCompletion(sections, answers) : { total: 0, answered: 0, percent: 0 };
  const isLastSection = currentSectionIdx === sections.length - 1;

  // ─── Loading / error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell title="Clinical History">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading questionnaire…</p>
        </div>
      </AppShell>
    );
  }

  if (loadError || !questionnaire || !analysis) {
    return (
      <AppShell title="Clinical History">
        <div className="max-w-md mx-auto mt-10 bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Failed to load questionnaire</h3>
          <p className="text-sm text-slate-600 mb-5">{loadError}</p>
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

  const patient = analysis.patientInfo;

  return (
    <AppShell title="Clinical History">
      <div className="max-w-3xl mx-auto space-y-5 pb-10">

        {/* ── Back link ───────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => navigate(`/diagnosisdetail/${analysisId}`)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Diagnosis
        </button>

        {/* ── Patient header ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Clinical History Questionnaire</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-slate-500">
              <span>Patient: <span className="font-semibold text-slate-700">{patient.name}</span></span>
              <span>·</span>
              <span>Age: <span className="font-semibold text-slate-700">{patient.age}</span></span>
              <span>·</span>
              <span>Gender: <span className="font-semibold text-slate-700 capitalize">{patient.gender}</span></span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className="inline-block text-xs font-mono bg-gray-100 text-slate-500 rounded px-2 py-1">
              {analysisId?.slice(-8)}
            </span>
            {lastSaved && (
              <p className="text-xs text-emerald-600 mt-1">
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {/* ── Progress ─────────────────────────────────────────────────────── */}
        <QuestionnaireProgress
          sections={sections}
          currentIndex={showSummary ? sections.length : currentSectionIdx}
          answers={answers}
          onJump={handleJump}
          totalRequired={completion.total}
          answeredRequired={completion.answered}
          percent={completion.percent}
        />

        {/* ── Role restriction banner (Cardiologist view-only) ─────────────── */}
        {!canSubmit && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              You have <span className="font-semibold">read-only access</span> to this questionnaire.
              Only PHC Doctors can submit clinical history.
            </p>
          </div>
        )}

        {/* ── Main content: Renderer OR Summary ────────────────────────────── */}
        {showSummary ? (
          <>
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-bold text-slate-700">Review your answers</h2>
              <span className="text-xs text-slate-400">Check before submitting</span>
            </div>
            <QuestionnaireSummary
              sections={sections}
              answers={answers}
              submitting={submitting}
              onEditSection={handleJump}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
            />
          </>
        ) : (
          sections[currentSectionIdx] && (
            <QuestionnaireRenderer
              section={sections[currentSectionIdx]}
              answers={answers}
              errors={errors}
              disabled={!canSubmit}
              onAnswer={handleAnswer}
            />
          )
        )}

        {/* ── Footer navigation ─────────────────────────────────────────────── */}
        {!showSummary && (
          <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-100 rounded-xl shadow-lg px-5 py-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentSectionIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-3">
              {canSubmit && (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-gray-50 transition"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Save Draft</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition"
              >
                {isLastSection ? 'Review Answers' : 'Next'}
                {!isLastSection && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
