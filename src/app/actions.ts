'use server';

import { suggestRefactoringSteps, SuggestRefactoringStepsInput, SuggestRefactoringStepsOutput } from '@/ai/flows/suggest-refactoring-steps';

export async function getAiRefactoringSuggestion(
  input: SuggestRefactoringStepsInput
): Promise<SuggestRefactoringStepsOutput> {
  // Add any additional server-side validation or logging here if needed.
  try {
    const result = await suggestRefactoringSteps(input);
    return result;
  } catch (error) {
    // It's good practice to handle errors and not expose internal details.
    console.error("AI refactoring suggestion failed:", error);
    throw new Error("Failed to get AI suggestion. Please try again.");
  }
}
