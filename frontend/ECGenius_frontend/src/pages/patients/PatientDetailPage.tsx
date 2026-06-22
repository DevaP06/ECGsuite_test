import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, RefreshCw,
  User, Phone, Mail, MapPin, Shield, ClipboardList,
  Upload, Pill, Stethoscope, FileText,
} from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import ECGTimeline from '../../components/patients/ECGTimeline';
import TrendAnalytics from '../../components/patients/TrendAnalytics';
import PatientTrendsSummary from '../../components/patients/PatientTrendsSummary';
import { patientService } from '../../services/patientService';
import { extractErrorMessage } from '../../utils/errorUtils';
import { isDoctor } from '../../features/auth/roleUtils';
import type { Patient, PatientTrends } from '../../types/patient';
import type { ECGAnalysis } from '../../types/ecg';

// ─── Info row helper ──────────────────────────────────────────────────────────
function InfoRow({
  icon: Icon, label, value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | number | null;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-semibold text-slate-800 break-words">{value}</p>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  title, children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const canEdit = isDoctor();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [analyses, setAnalyses] = useState<ECGAnalysis[]>([]);
  const [trends, setTrends] = useState<PatientTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatient = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await patientService.getPatient(patientId);
      setPatient(data);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Failed to load patient.'));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const loadAnalyses = useCallback(async () => {
    if (!patientId) return;
    setAnalysesLoading(true);
    try {
      const data = await patientService.getPatientAnalyses(patientId);
      setAnalyses(data);
    } catch {
      // Non-fatal — analyses section shows empty state
      setAnalyses([]);
    } finally {
      setAnalysesLoading(false);
    }
  }, [patientId]);

  const loadTrends = useCallback(async () => {
    if (!patientId) return;
    setTrendsLoading(true);
    try {
      const data = await patientService.getPatientTrends(patientId);
      setTrends(data);
    } catch {
      // Non-fatal — trends section shows empty state
      setTrends(null);
    } finally {
      setTrendsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadPatient();
    loadAnalyses();
    loadTrends();
  }, [loadPatient, loadAnalyses, loadTrends]);

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell title="Patient Detail">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-slate-600 font-semibold">Loading patient…</p>
        </div>
      </AppShell>
    );
  }

  // ─── Error state ────────────────────────────────────────────────────────────
  if (error || !patient) {
    return (
      <AppShell title="Patient Detail">
        <div className="max-w-md mx-auto mt-10 bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Failed to load patient</h3>
          <p className="text-sm text-slate-600 mb-5">{error ?? 'Patient not found.'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadPatient}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <Link
              to="/patients"
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition"
            >
              Back to List
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // ─── Derived values ──────────────────────────────────────────────────────────
  const registeredDate = patient.createdAt
    ? new Date(patient.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <AppShell title="Patient Detail">
      <div className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Patients
          </button>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link
                to={`/ecgupload?patientId=${patientId}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition"
              >
                <Upload className="w-4 h-4" />
                Upload ECG
              </Link>
            )}
          </div>
        </div>

        {/* ── Patient header card ───────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar placeholder */}
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-800">{patient.name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-slate-500">
                <span>{patient.age} years old</span>
                <span>·</span>
                <span className="capitalize">{patient.gender}</span>
                {patient.totalECGs !== undefined && (
                  <>
                    <span>·</span>
                    <span>{patient.totalECGs} ECG{patient.totalECGs !== 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-mono bg-gray-100 text-slate-500 rounded px-2 py-1">
                {(patient._id ?? '').slice(-8)}
              </span>
              <p className="text-xs text-slate-400 mt-1">Registered {registeredDate}</p>
            </div>
          </div>
        </div>

        {/* ── Demographics + Contact ────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Section title="Demographics">
            <div className="space-y-3">
              <InfoRow icon={User}   label="Full Name" value={patient.name} />
              <InfoRow icon={FileText} label="Age"     value={`${patient.age} years`} />
              <InfoRow icon={User}   label="Gender"    value={patient.gender} />
              {patient.lastVisit && (
                <InfoRow icon={ClipboardList} label="Last Visit" value={new Date(patient.lastVisit).toLocaleDateString()} />
              )}
            </div>
          </Section>

          <Section title="Contact Information">
            <div className="space-y-3">
              <InfoRow icon={Phone}  label="Phone"             value={patient.contact.phone} />
              <InfoRow icon={Mail}   label="Email"             value={patient.contact.email} />
              <InfoRow icon={MapPin} label="Address"           value={patient.contact.address} />
              <InfoRow icon={Shield} label="Emergency Contact" value={patient.contact.emergencyContact} />
            </div>
          </Section>
        </div>

        {/* ── Medical Profile ───────────────────────────────────────────── */}
        {patient.medicalProfile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {patient.medicalProfile.knownConditions && (
              <Section title="Known Conditions">
                <div className="flex items-start gap-2">
                  <Stethoscope className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {patient.medicalProfile.knownConditions}
                  </p>
                </div>
              </Section>
            )}
            {patient.medicalProfile.currentMedications && (
              <Section title="Current Medications">
                <div className="flex items-start gap-2">
                  <Pill className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {patient.medicalProfile.currentMedications}
                  </p>
                </div>
              </Section>
            )}
            {patient.medicalProfile.medicalHistory && (
              <Section title="Medical History">
                <div className="flex items-start gap-2">
                  <ClipboardList className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {patient.medicalProfile.medicalHistory}
                  </p>
                </div>
              </Section>
            )}
            {patient.medicalProfile.notes && (
              <Section title="Clinical Notes">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {patient.medicalProfile.notes}
                  </p>
                </div>
              </Section>
            )}
          </div>
        )}

        {/* ── ECG Timeline ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">ECG History</h2>
            {analysesLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>
          {analysesLoading ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse h-32" />
          ) : (
            <ECGTimeline analyses={analyses} preferClinical={canEdit} />
          )}
        </div>

        {/* ── Trends Summary ────────────────────────────────────────────── */}
        <PatientTrendsSummary trends={trends} loading={trendsLoading} />

        {/* ── Trend Analytics ───────────────────────────────────────────── */}
        {!analysesLoading && (
          <TrendAnalytics analyses={analyses} />
        )}

      </div>
    </AppShell>
  );
}
