import { AIMessage } from 'langchain';
import { OpenRouterService } from '../../services/openrouterService.ts';
import type { GraphState } from '../graph.ts';
import { AnalyticalResponseSchema, getErrorResponsePrompt, getMultiStepSynthesisPrompt, getSystemPrompt, getUserPromptTemplate } from '../../prompts/v1/analyticalResponse.ts';

async function handleErrorResponse(state: GraphState, llmClient: OpenRouterService): Promise<Partial<GraphState>> {
  const systemPrompt = getSystemPrompt()
  const userPrompt = getErrorResponsePrompt(state.error!, state.question)
  const { data, error } = await llmClient.generateStructured(
    systemPrompt,
    userPrompt,
    AnalyticalResponseSchema
  )

  if (error) {
    return {
      messages: [new AIMessage(`An error ocurred ${error}`)],
      error,
      answer: `An error ocurred ${error}`,
      followUpQuestions: []
    }
  }

  return {
    messages: [new AIMessage(data?.answer!)],
    answer: data?.answer,
    followUpQuestions: data?.followUpQuestions
  };
}

async function handleSuccessResponse(state: GraphState, llmClient: OpenRouterService): Promise<Partial<GraphState>> { 
  const systemPrompt = getSystemPrompt()
  let _userPrompt: string

  if (Boolean(
    state.isMultiStep 
    && state.subResults?.length 
    && state.subQuestions?.length 
    && state.subQueries?.length
  )) {
    console.log('Sintetizando o relatório completo')
    const stepsData = state.subResults!.map((results, index) => ({
      stepNumber: index + 1,
      question: state.subQuestions![index],
      query: state.subQueries![index],
      results: JSON.stringify(results)
    }))

    _userPrompt = getMultiStepSynthesisPrompt(state.question!, stepsData)
  } else {
    _userPrompt = getUserPromptTemplate(
      state.question!,
      state.query!,
      JSON.stringify(state.dbResults)
    )
  }

  const { data, error } = await llmClient.generateStructured(
    systemPrompt,
    _userPrompt,
    AnalyticalResponseSchema
  )

  if (error) {
    console.error('Failed to generate analytical response')
    return {
      error: `Response generation failed: ${error}`
    }
  }

  return {
    messages: [new AIMessage(data!.answer)],
    answer: data!.answer,
    followUpQuestions: data!.followUpQuestions,
  };
}

export function createAnalyticalResponseNode(llmClient: OpenRouterService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {

      if (state.error) {
        return await handleErrorResponse(state, llmClient)
      }

      return await handleSuccessResponse(state, llmClient) 
    } catch (error: any) {
      console.error('Error generating analytical response:', error.message);
      return {
        error: `Response generation failed: ${error.message}`,
      };
    }
  };
}
