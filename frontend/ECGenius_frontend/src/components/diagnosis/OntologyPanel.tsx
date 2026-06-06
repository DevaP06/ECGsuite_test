import { BookOpen, Tag, AlertTriangle, Percent, FileSearch, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { OntologyItem } from '../../types/ecg';
import ConfidenceTierBadge from '../ecg/ConfidenceTierBadge';

interface OntologyPanelProps {
  items?: OntologyItem[] | null;
}

function OntologyCard({ item }: { item: OntologyItem }) {
  const [expanded, setExpanded] = useState(false);

  const urgencyColor =
    item.urgencyTier === 'Tier 1'
      ? 'text-red-600 bg-red-50 border-red-200'
      : item.urgencyTier === 'Tier 2'
      ? 'text-amber-600 bg-amber-50 border-amber-200'
      : 'text-emerald-600 bg-emerald-50 border-emerald-200';

  const hasExtended = item.snomedCode || item.icd10Code || item.evidence?.length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-slate-800 leading-snug">{item.displayName}</h4>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <ConfidenceTierBadge tier={item.confidenceTier} size="sm" />
            {item.severity && (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                {item.severity}
              </span>
            )}
          </div>
        </div>
        {item.urgencyTier && (
          <span
            className={`shrink-0 text-xs font-semibold border rounded-full px-2.5 py-1 ${urgencyColor}`}
          >
            {item.urgencyTier}
          </span>
        )}
      </div>

      {/* Key metrics row */}
      <div className="border-t border-gray-50 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
        {item.confidence != null && (
          <div className="flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>
              <span className="font-semibold text-slate-800">{item.confidence}%</span> confidence
            </span>
          </div>
        )}
        {item.snomedDisplay && (
          <div className="flex items-center gap-1.5 col-span-2">
            <Tag className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">{item.snomedDisplay}</span>
          </div>
        )}
        {item.icd10Display && (
          <div className="flex items-center gap-1.5 col-span-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{item.icd10Display}</span>
          </div>
        )}
      </div>

      {/* Expandable details */}
      {hasExtended && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-2.5 text-xs text-slate-500 hover:bg-gray-50 transition border-t border-gray-50"
          >
            <span>Coding &amp; Evidence</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div className="px-5 pb-4 space-y-3 text-xs text-slate-600">
              {item.snomedCode && (
                <div className="flex items-start gap-2">
                  <Tag className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-slate-700 block">SNOMED CT</span>
                    <span className="text-slate-500">{item.snomedCode}</span>
                    {item.snomedDisplay && (
                      <span className="text-slate-500"> — {item.snomedDisplay}</span>
                    )}
                  </div>
                </div>
              )}
              {item.icd10Code && (
                <div className="flex items-start gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-slate-700 block">ICD-10</span>
                    <span className="text-slate-500">{item.icd10Code}</span>
                    {item.icd10Display && (
                      <span className="text-slate-500"> — {item.icd10Display}</span>
                    )}
                  </div>
                </div>
              )}
              {item.evidence && item.evidence.length > 0 && (
                <div className="flex items-start gap-2">
                  <FileSearch className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-slate-700 block mb-1">Evidence</span>
                    <ul className="space-y-0.5 list-disc list-inside text-slate-500">
                      {item.evidence.map((ev, i) => <li key={i}>{ev}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OntologyPanel({ items }: OntologyPanelProps) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Ontology Reasoning</h3>
        </div>
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center">
          <p className="text-sm text-slate-500">Ontology data not available for this analysis.</p>
          <p className="text-xs text-slate-400 mt-1">SNOMED CT and ICD-10 enrichment will appear here when provided by the backend.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-slate-800">Ontology Reasoning</h3>
        <span className="ml-auto text-xs text-slate-400">{items.length} finding{items.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => <OntologyCard key={i} item={item} />)}
      </div>
    </div>
  );
}
