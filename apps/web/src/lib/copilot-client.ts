import { apiClient } from './api-client';
import type { ERPCopilotQueryResponse, LessonPlanRequest, LessonPlanResponse, PredictiveAnalyticsReport, TeachingLanguage } from '@krypton/types';
export async function runCopilotQuery(query: string, language: TeachingLanguage = 'English', signal?: AbortSignal): Promise<ERPCopilotQueryResponse> {
  const { data } = await apiClient.post<ERPCopilotQueryResponse>('/teacher-ai/copilot-query', {query, language}, {timeout:45000, signal});
  return data;
}
export async function generateLessonPlan(params: LessonPlanRequest, signal?: AbortSignal): Promise<LessonPlanResponse> {
  const { data } = await apiClient.post<LessonPlanResponse>('/teacher-ai/lesson-plan', params, {timeout:60000, signal});
  return data;
}
export async function fetchAtRiskStudents(signal?: AbortSignal): Promise<PredictiveAnalyticsReport> {
  const { data } = await apiClient.get<PredictiveAnalyticsReport>('/teacher-ai/at-risk', {signal});
  return data;
}
