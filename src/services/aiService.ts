import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface AICampusAssistantQuery {
  studentQuery: string;
  collegeId: string;
  course?: string;
  semester?: string;
}

export interface AITeamMatchRequest {
  teamRequestId: string;
  skillsNeeded: string[];
  collegeId: string;
}

export interface AIRecommendationContext {
  userId: string;
  collegeId: string;
  interests: string[];
}

/**
 * AI-Ready Backend Interface
 * Note: Per security requirements, AI processing and external LLM keys are handled
 * securely via Supabase Edge Functions or backend services. Never expose API keys on frontend.
 */
export async function queryCampusAIAssistant(
  params: AICampusAssistantQuery
): Promise<{ answer: string; sources?: string[]; error?: any }> {
  if (!isSupabaseConfigured) {
    return {
      answer: 'Campus AI Assistant backend is ready for deployment via Supabase Edge Functions.',
    };
  }

  try {
    // Invokes serverless edge function 'campus-ai-assistant'
    const { data, error } = await supabase.functions.invoke('campus-ai-assistant', {
      body: params,
    });

    if (error) throw error;
    return { answer: data.answer, sources: data.sources };
  } catch (err: any) {
    return {
      answer: '',
      error: 'Campus AI Assistant service is connecting. Please try again shortly.',
    };
  }
}

/**
 * Prepares AI summarization of academic course notes & syllabus resources
 */
export async function requestNoteSummary(
  resourceId: string
): Promise<{ summary: string; keyPoints?: string[]; error?: any }> {
  if (!isSupabaseConfigured) {
    return {
      summary: 'AI Note Summaries backend hook prepared for integration.',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('summarize-notes', {
      body: { resourceId },
    });

    if (error) throw error;
    return { summary: data.summary, keyPoints: data.keyPoints };
  } catch (err: any) {
    return { summary: '', error: err.message };
  }
}

/**
 * Skill-based teammate recommendation engine
 */
export async function matchTeamCandidates(
  params: AITeamMatchRequest
): Promise<{ recommendedStudentIds: string[]; matchScores: Record<string, number> }> {
  if (!isSupabaseConfigured) {
    return { recommendedStudentIds: [], matchScores: {} };
  }

  try {
    const { data, error } = await supabase.functions.invoke('team-matching', {
      body: params,
    });

    if (error) throw error;
    return {
      recommendedStudentIds: data.studentIds || [],
      matchScores: data.scores || {},
    };
  } catch {
    return { recommendedStudentIds: [], matchScores: {} };
  }
}
