/**
 * Intake Persistence — save intake questionnaire answers to Supabase
 * when a user signs up, and load submission data for the client dashboard.
 */

import { supabase } from './supabase';

export interface IntakeAnswers {
  selectedTier: 'bank_ready' | 'loan_ready' | 'approved';
  businessName: string;
  timeInBusiness: string;
  financingType: string;
  loanAmount: string;
  declinedBefore: boolean | null;
}

/**
 * Save intake answers as a new scorecard_submissions row.
 * - bank_ready tier → status 'in_progress' (DIY user, needs to complete scorecard)
 * - loan_ready / approved → status 'submitted' with submitted_at timestamp
 * Returns the new submission id, or null on error.
 */
export async function saveIntakeSubmission(userId: string, answers: IntakeAnswers): Promise<string | null> {
  const isAdvisorTier = answers.selectedTier !== 'bank_ready';

  const { data, error } = await (supabase as any)
    .from('scorecard_submissions')
    .insert({
      user_id: userId,
      business_name: answers.businessName,
      loan_purpose: answers.financingType,
      status: isAdvisorTier ? 'submitted' : 'in_progress',
      submitted_at: isAdvisorTier ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  if (error) return null;
  return data.id;
}

/**
 * Load the client's most recent submission (any status) for the dashboard.
 * Returns the full row or null if none exists.
 */
export async function loadClientSubmission(userId: string) {
  const { data, error } = await (supabase as any)
    .from('scorecard_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Update the user's profile with tier and business_name from intake answers.
 */
export async function updateProfileFromIntake(userId: string, answers: IntakeAnswers) {
  await (supabase as any)
    .from('profiles')
    .update({
      business_name: answers.businessName,
      tier: answers.selectedTier,
    })
    .eq('id', userId);
}
