import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from './client';

export function useAskAssistant() {
  return useMutation({
    mutationFn: async (vars: { question: string; conversationId?: string }) =>
      (await api.post('/assistant/ask', vars)).data as { conversationId: string; answer: string },
  });
}

export function useStudyQuestions() {
  return useMutation({
    mutationFn: async (vars: { passage: string; focus?: string }) =>
      (await api.post('/assistant/study-questions', vars)).data as { answer: string },
  });
}

export function useDevotionalPrompt() {
  return useMutation({
    mutationFn: async (vars: { theme?: string }) =>
      (await api.post('/assistant/devotional-prompt', vars)).data as { answer: string },
  });
}

export function useReadingPlan() {
  return useMutation({
    mutationFn: async (vars: { goal: string; durationDays?: number }) =>
      (await api.post('/assistant/reading-plan', vars)).data as { answer: string },
  });
}

export function useStructurePrayer() {
  return useMutation({
    mutationFn: async (vars: { situation: string }) =>
      (await api.post('/assistant/structure-prayer', vars)).data as { answer: string },
  });
}

export function useSuggestedGroups() {
  return useQuery({ queryKey: ['recommendations', 'groups'], queryFn: async () => (await api.get('/recommendations/groups')).data });
}

export function usePeopleToPrayWith() {
  return useQuery({ queryKey: ['recommendations', 'people'], queryFn: async () => (await api.get('/recommendations/people')).data });
}
