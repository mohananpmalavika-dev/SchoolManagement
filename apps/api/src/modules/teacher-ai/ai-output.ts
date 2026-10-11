import { BadGatewayException } from '@nestjs/common';
import { AIQuestion } from '@krypton/types';

export const objectSchema = (properties: Record<string, unknown>) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
export const stringSchema = { type: 'string' };
export const stringListSchema = { type: 'array', items: stringSchema };
const invalid = (): never => { throw new BadGatewayException('AI returned an invalid teaching draft. Please generate again.'); };
export function aiObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
export function aiText(value: unknown, max = 2000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) return invalid();
  return value.trim();
}
export function aiList(value: unknown, max = 6): string[] {
  if (!Array.isArray(value) || value.length > max) return invalid();
  return value.map(v => aiText(v, 500));
}
export function keyedItems(value: unknown, key: string, expected: string[]): Record<string, unknown>[] {
  const items = aiObject(value)[key];
  if (!Array.isArray(items) || items.length !== expected.length) return invalid();
  const result = items.map(aiObject);
  const keys = result.map(item => aiText(item.key, 20));
  if (new Set(keys).size !== expected.length || keys.some(k => !expected.includes(k))) return invalid();
  return result;
}
export function questionPaper(value: unknown, requested: string) {
  const paper = aiObject(value);
  if (!Array.isArray(paper.questions) || paper.questions.length !== 10) return invalid();
  const questions: AIQuestion[] = paper.questions.map(value => {
    const q = aiObject(value), type = q.type;
    if (!['MCQ', 'SHORT_ANSWER'].includes(String(type)) || (requested !== 'MIXED' && type !== requested)) return invalid();
    const options = aiList(q.options, 4), answer = aiText(q.answer, 1500);
    if (type === 'MCQ' && (options.length !== 4 || new Set(options).size !== 4 || !options.includes(answer))) return invalid();
    if (type === 'SHORT_ANSWER' && options.length) return invalid();
    if (typeof q.marks !== 'number' || !Number.isInteger(q.marks) || q.marks < 1 || q.marks > 10) return invalid();
    return { type: type as AIQuestion['type'], question: aiText(q.question, 1000), options, answer, explanation: aiText(q.explanation, 1500), marks: q.marks };
  });
  if (new Set(questions.map(q => q.question.toLowerCase())).size !== 10) return invalid();
  if (requested === 'MIXED' && new Set(questions.map(q => q.type)).size !== 2) return invalid();
  return { title: aiText(paper.title, 200), instructions: aiText(paper.instructions, 1000), questions, warnings: aiList(paper.warnings) };
}
