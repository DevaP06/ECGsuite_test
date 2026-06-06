type ConfidenceTier = 'Confirmed' | 'Probable' | 'Possible' | 'Incidental' | string;

interface ConfidenceTierBadgeProps {
  tier?: ConfidenceTier | null;
  size?: 'sm' | 'md';
}

const TIER_STYLES: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  Confirmed:  { bg: 'bg-emerald-100', text: 'text-emerald-800', ring: 'ring-emerald-300', dot: 'bg-emerald-500' },
  Probable:   { bg: 'bg-blue-100',    text: 'text-blue-800',    ring: 'ring-blue-300',    dot: 'bg-blue-500'    },
  Possible:   { bg: 'bg-amber-100',   text: 'text-amber-800',   ring: 'ring-amber-300',   dot: 'bg-amber-500'   },
  Incidental: { bg: 'bg-slate-100',   text: 'text-slate-700',   ring: 'ring-slate-300',   dot: 'bg-slate-400'   },
};

const FALLBACK = { bg: 'bg-gray-100', text: 'text-gray-600', ring: 'ring-gray-200', dot: 'bg-gray-400' };

export default function ConfidenceTierBadge({ tier, size = 'md' }: ConfidenceTierBadgeProps) {
  if (!tier) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${FALLBACK.bg} ${FALLBACK.text} ring-1 ${FALLBACK.ring} rounded-full font-medium ${
          size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-3 py-1'
        }`}
        aria-label="Confidence tier unavailable"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${FALLBACK.dot}`} />
        Unknown
      </span>
    );
  }

  const styles = TIER_STYLES[tier] ?? FALLBACK;

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${styles.bg} ${styles.text} ring-1 ${styles.ring} rounded-full font-medium ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-3 py-1'
      }`}
      aria-label={`Confidence tier: ${tier}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      {tier}
    </span>
  );
}
