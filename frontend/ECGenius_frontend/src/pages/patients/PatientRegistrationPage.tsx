import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../../layouts/AppShell';
import { patientService } from '../../services/patientService';
import { extractErrorMessage } from '../../utils/errorUtils';

// ─── Form state ───────────────────────────────────────────────────────────────
interface FormState {
  // Demographics
  name: string;
  age: string;
  gender: string;
  // Contact
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  // Medical profile (optional)
  knownConditions: string;
  currentMedications: string;
  medicalHistory: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: '', age: '', gender: '',
  phone: '', email: '', address: '', emergencyContact: '',
  knownConditions: '', currentMedications: '', medicalHistory: '', notes: '',
};

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 mb-1">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input({
  name, value, onChange, placeholder, type = 'text', disabled,
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
    />
  );
}

function Textarea({
  name, value, onChange, placeholder, disabled, rows = 3,
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none disabled:opacity-50"
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PatientRegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name as keyof FormState]) return prev;
      const next = { ...prev };
      delete next[name as keyof FormState];
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim())             newErrors.name             = 'Full name is required';
    if (!form.age)                     newErrors.age              = 'Age is required';
    else if (Number(form.age) < 1 || Number(form.age) > 120)
                                       newErrors.age              = 'Age must be between 1 and 120';
    if (!form.gender)                  newErrors.gender           = 'Gender is required';
    if (!form.phone.trim())            newErrors.phone            = 'Phone number is required';
    if (!form.emergencyContact.trim()) newErrors.emergencyContact = 'Emergency contact is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const patient = await patientService.createPatient({
        name:   form.name.trim(),
        age:    Number(form.age),
        gender: form.gender,
        contact: {
          phone:            form.phone.trim(),
          email:            form.email.trim() || undefined,
          address:          form.address.trim() || undefined,
          emergencyContact: form.emergencyContact.trim(),
        },
        medicalProfile: (
          form.knownConditions || form.currentMedications || form.medicalHistory || form.notes
        ) ? {
          knownConditions:    form.knownConditions.trim() || undefined,
          currentMedications: form.currentMedications.trim() || undefined,
          medicalHistory:     form.medicalHistory.trim() || undefined,
          notes:              form.notes.trim() || undefined,
        } : undefined,
      });
      toast.success(`Patient "${patient.name}" registered successfully.`);
      navigate(`/patients/${patient._id}`);
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to register patient.'));
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (key: keyof FormState) =>
    errors[key] ? (
      <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
    ) : null;

  return (
    <AppShell title="Register Patient">
      <div className="max-w-3xl mx-auto space-y-5 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/patients"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Patients
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Register New Patient</h1>
              <p className="text-xs text-slate-500">Create a patient record before uploading an ECG.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7" noValidate>

            {/* ── Demographics ──────────────────────────────────────────── */}
            <section>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 pb-1 border-b border-gray-100">
                Demographics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FieldLabel text="Full Name" required />
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Patient full name"
                    disabled={submitting}
                  />
                  {fieldError('name')}
                </div>

                <div>
                  <FieldLabel text="Age" required />
                  <Input
                    name="age"
                    type="number"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="e.g. 45"
                    disabled={submitting}
                  />
                  {fieldError('age')}
                </div>

                <div>
                  <FieldLabel text="Gender" required />
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    disabled={submitting}
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {fieldError('gender')}
                </div>
              </div>
            </section>

            {/* ── Contact Information ───────────────────────────────────── */}
            <section>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 pb-1 border-b border-gray-100">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel text="Phone Number" required />
                  <Input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    disabled={submitting}
                  />
                  {fieldError('phone')}
                </div>

                <div>
                  <FieldLabel text="Email Address" />
                  <Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="patient@example.com"
                    disabled={submitting}
                  />
                </div>

                <div className="sm:col-span-2">
                  <FieldLabel text="Address" />
                  <Input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Street, City, State, PIN"
                    disabled={submitting}
                  />
                </div>

                <div className="sm:col-span-2">
                  <FieldLabel text="Emergency Contact" required />
                  <Input
                    name="emergencyContact"
                    value={form.emergencyContact}
                    onChange={handleChange}
                    placeholder="Name — Relationship — Phone"
                    disabled={submitting}
                  />
                  {fieldError('emergencyContact')}
                </div>
              </div>
            </section>

            {/* ── Medical Profile (optional) ─────────────────────────────── */}
            <section>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 pb-1 border-b border-gray-100">
                Medical Profile
                <span className="normal-case font-normal text-slate-400 ml-1.5">(optional)</span>
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                This information is used to provide clinical context alongside ECG analysis.
              </p>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <FieldLabel text="Known Conditions" />
                  <Textarea
                    name="knownConditions"
                    value={form.knownConditions}
                    onChange={handleChange}
                    placeholder="e.g. Hypertension (2020), Type 2 Diabetes (2018)"
                    disabled={submitting}
                    rows={2}
                  />
                </div>

                <div>
                  <FieldLabel text="Current Medications" />
                  <Textarea
                    name="currentMedications"
                    value={form.currentMedications}
                    onChange={handleChange}
                    placeholder="e.g. Metformin 500mg 2x daily, Amlodipine 5mg 1x daily"
                    disabled={submitting}
                    rows={2}
                  />
                </div>

                <div>
                  <FieldLabel text="Medical History" />
                  <Textarea
                    name="medicalHistory"
                    value={form.medicalHistory}
                    onChange={handleChange}
                    placeholder="Previous surgeries, hospitalisations, family cardiac history…"
                    disabled={submitting}
                    rows={3}
                  />
                </div>

                <div>
                  <FieldLabel text="Clinical Notes" />
                  <Textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Any additional notes for the clinical team…"
                    disabled={submitting}
                    rows={2}
                  />
                </div>
              </div>
            </section>

            {/* ── Submit ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering…
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Register Patient
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/patients')}
                disabled={submitting}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </AppShell>
  );
}
