export interface AIRecommendationRequest {
  userGoal: string;
  fitnessLevel: string;
  equipment: string[];
  recentWorkloadRatio: number;
  recoveryScore: number;
}

export interface AIRecommendationResponse {
  title: string;
  recommendation: string;
  reason: string;
  confidence: number;
  workoutData?: Record<string, unknown>;
}

export interface AIProvider {
  generateRecommendation(req: AIRecommendationRequest): Promise<AIRecommendationResponse>;
  summarizeProgress(metrics: Record<string, unknown>): Promise<string>;
  explainRecommendation(recommendationId: string, context: Record<string, unknown>): Promise<string>;
}

export class MockAIProvider implements AIProvider {
  public async generateRecommendation(req: AIRecommendationRequest): Promise<AIRecommendationResponse> {
    return {
      title: `AI-Guided ${req.userGoal} Session`,
      recommendation: `Recommended adaptive session based on recovery score (${req.recoveryScore}/100) and workload ratio (${req.recentWorkloadRatio}).`,
      reason: 'Rule-checked AI synthesis optimizing strength and workload management.',
      confidence: 0.87,
      workoutData: {
        suggestedDuration: 45,
        equipmentNeeded: req.equipment,
      },
    };
  }

  public async summarizeProgress(metrics: Record<string, unknown>): Promise<string> {
    return `Progress summary: Adherence is stable at ${metrics.adherence || 85}%. Consistent progressive workload logged.`;
  }

  public async explainRecommendation(_recommendationId: string, context: Record<string, unknown>): Promise<string> {
    return `This recommendation was generated considering your recovery score of ${context.recoveryScore || 75} and primary goal of ${context.primaryGoal || 'general fitness'}.`;
  }
}

export class DisabledAIProvider implements AIProvider {
  public async generateRecommendation(req: AIRecommendationRequest): Promise<AIRecommendationResponse> {
    return {
      title: 'Standard Fitness Plan',
      recommendation: `Plan tailored for ${req.userGoal}.`,
      reason: 'Deterministic rule-based strategy (AI Provider disabled).',
      confidence: 0.90,
    };
  }

  public async summarizeProgress(): Promise<string> {
    return 'Deterministic progress tracking enabled.';
  }

  public async explainRecommendation(): Promise<string> {
    return 'Recommendation generated using deterministic rule strategy.';
  }
}

export class AIProviderFactory {
  public static getProvider(mode = 'mock'): AIProvider {
    if (mode === 'disabled') {
      return new DisabledAIProvider();
    }
    return new MockAIProvider();
  }
}
