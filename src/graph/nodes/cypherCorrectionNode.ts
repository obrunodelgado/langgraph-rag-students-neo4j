import type { OpenRouterService } from '../../services/openrouterService.ts';
import type { Neo4jService } from '../../services/neo4jService.ts';
import type { GraphState } from '../graph.ts';
import {
  CypherCorrectionSchema,
  getSystemPrompt,
  getUserPromptTemplate,
} from '../../prompts/v1/cypherCorrection.ts';

export function createCypherCorrectionNode(
  llmClient: OpenRouterService,
  neo4jService: Neo4jService,
) {

  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const correctionAttempts = (state.correctionAttempts ?? 0) + 1;
    try {
      if (!state.query || !state.validationError) {
        throw new Error('Missing query or validation error for correction');
      }

      const schema = await neo4jService.getSchema();
      const { data, error } = await llmClient.generateStructured(
        getSystemPrompt(schema),
        getUserPromptTemplate(state.query, state.validationError, state.question),
        CypherCorrectionSchema,
      );

      if (error || !data?.correctedQuery?.trim()) {
        throw new Error(error ?? 'No corrected query returned');
      }

      return {
        query: data.correctedQuery,
        originalQuery: state.originalQuery ?? state.query,
        correctionAttempts,
        needsCorrection: false,
        validationError: undefined,
        subQueries: state.subQueries?.map((query, index) =>
          index === state.currentStep ? data.correctedQuery : query,
        ),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error correcting query:', message);
      return {
        correctionAttempts,
        needsCorrection: false,
        error: `Query correction failed: ${message}`,
      };
    }
  };
}
