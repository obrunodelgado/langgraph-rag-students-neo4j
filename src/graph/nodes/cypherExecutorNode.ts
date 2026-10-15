import { Neo4jService } from '../../services/neo4jService.ts';
import type { GraphState } from '../graph.ts';

export function createCypherExecutorNode(neo4jService: Neo4jService) {

  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {

      return {
        isMultiStep: true,
      };
    } catch (error) {
      console.error('Error executing Cypher query:', error instanceof Error ? error.message : error);

      return {
        error: 'Invalid Cypher query - correction failed',
      };
    }

    }
  };
