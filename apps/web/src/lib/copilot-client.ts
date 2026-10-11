import { apiClient } from './api-client';
import type {
  ERPCopilotQueryRequest,
  ERPCopilotQueryResponse,
  LessonPlanRequest,
  LessonPlanResponse,
  PredictiveAnalyticsReport,
  TeachingLanguage,
} from '@krypton/types';

export async function runCopilotQuery(
  query: string,
  language: TeachingLanguage = 'English',
  signal?: AbortSignal
): Promise<ERPCopilotQueryResponse> {
  const { data } = await apiClient.post<ERPCopilotQueryResponse>(
    '/teacher-ai/copilot-query',
    { query, language },
    { timeout: 45000, signal }
  );
  return data;
}

export async function generateLessonPlan(
  params: LessonPlanRequest,
  signal?: AbortSignal
): Promise<LessonPlanResponse> {
  const { data } = await apiClient.post<LessonPlanResponse>(
    '/teacher-ai/lesson-plan',
    params,
    { timeout: 60000, signal }
  );
  return data;
}

export async function fetchAtRiskStudents(
  signal?: AbortSignal
): Promise<PredictiveAnalyticsReport> {
  try {
    // Attempt teacher-ai scoped endpoint first (accessible to teachers, class teachers & leaders)
    const { data } = await apiClient.get<PredictiveAnalyticsReport>(
      '/teacher-ai/at-risk',
      { signal }
    );
    return data;
  } catch (err) {
    // Fallback to predictive-analytics endpoint for administrators
    const { data } = await apiClient.get<PredictiveAnalyticsReport>(
      '/predictive-analytics',
      { signal }
    );
    return data;
  }
}
