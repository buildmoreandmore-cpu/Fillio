/**
 * SubmissionStatus — Shows the client their scorecard status after submission.
 *
 * Displays different banners based on status:
 *  - in_progress: "Complete your scorecard" CTA
 *  - submitted: "Under review — typically 1 business day"
 *  - under_review: "Your advisor is reviewing your file"
 *  - needs_info: "Your advisor needs one more thing"
 *  - confirmed: "Your report is ready"
 *  - report_released: "View your full report"
 */

import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { loadLatestSubmission } from '../lib/scorecardPersistence';

const NAVY = '#0B2820';
const EMERALD = '#1D9E75';
const GOLD = '#BA7517';

interface SubmissionStatusProps {
  userId: string;
  onContinueScorecard: () => void;
  onViewReport?: () => void;
}

interface StatusConfig {
  icon: 'chart' | 'check-circle' | 'shield-check' | 'lock' | 'dollar';
  color: string;
  bgColor: string;
  borderColor: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaAction?: 'continue' | 'report';
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  in_progress: {
    icon: 'chart',
    color: GOLD,
    bgColor: `${GOLD}08`,
    borderColor: `${GOLD}30`,
    title: 'Scorecard In Progress',
    description: 'You have a draft scorecard saved. Pick up where you left off.',
    ctaLabel: 'Continue Your Scorecard',
    ctaAction: 'continue',
  },
  submitted: {
    icon: 'check-circle',
    color: EMERALD,
    bgColor: `${EMERALD}08`,
    borderColor: `${EMERALD}30`,
    title: 'Scorecard Submitted',
    description: 'Your scorecard is in our review queue. Typical review time: 1 business day.',
  },
  under_review: {
    icon: 'shield-check',
    color: NAVY,
    bgColor: `${NAVY}06`,
    borderColor: `${NAVY}20`,
    title: 'Under Review',
    description: 'Your advisor is reviewing your file. We\'ll notify you when the review is complete.',
  },
  needs_info: {
    icon: 'shield-check',
    color: '#DC4444',
    bgColor: 'rgba(220,68,68,0.04)',
    borderColor: 'rgba(220,68,68,0.2)',
    title: 'We Need One More Thing',
    description: 'Your advisor has a question about your submission. Check your email for details.',
  },
  confirmed: {
    icon: 'check-circle',
    color: EMERALD,
    bgColor: `${EMERALD}08`,
    borderColor: `${EMERALD}30`,
    title: 'Your Report Is Ready',
    description: 'Your True Readiness Score has been confirmed. View your full report below.',
    ctaLabel: 'View Your Report',
    ctaAction: 'report',
  },
  report_released: {
    icon: 'check-circle',
    color: EMERALD,
    bgColor: `${EMERALD}08`,
    borderColor: `${EMERALD}30`,
    title: 'Report Available',
    description: 'Your True Readiness Score report is available to download.',
    ctaLabel: 'View Your Report',
    ctaAction: 'report',
  },
};

const SubmissionStatus: React.FC<SubmissionStatusProps> = ({ userId, onContinueScorecard, onViewReport }) => {
  const [submission, setSubmission] = useState<{ id: string; status: string; submittedAt: string | null; overallScore: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLatestSubmission(userId).then((data) => {
      setSubmission(data);
      setIsLoading(false);
    });
  }, [userId]);

  if (isLoading) return null;
  if (!submission) return null;

  const config = STATUS_CONFIG[submission.status];
  if (!config) return null;

  const handleCta = () => {
    if (config.ctaAction === 'continue') onContinueScorecard();
    if (config.ctaAction === 'report' && onViewReport) onViewReport();
  };

  return (
    <div
      className="rounded-xl border p-5 mb-6"
      style={{ backgroundColor: config.bgColor, borderColor: config.borderColor }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <Icon name={config.icon} size={20} style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-sm font-bold" style={{ color: NAVY }}>
              {config.title}
            </h3>
            {submission.overallScore > 0 && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${EMERALD}15`, color: EMERALD }}
              >
                Score: {submission.overallScore}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            {config.description}
          </p>
          {submission.submittedAt && submission.status !== 'in_progress' && (
            <p className="text-[11px] text-slate-400 mb-3">
              Submitted {new Date(submission.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
          {config.ctaLabel && (
            <button
              onClick={handleCta}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: config.color }}
            >
              {config.ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionStatus;
