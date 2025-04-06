import { LLMJudgeService } from "@odin/core/services";

import {
  EvaluationCriteriaTypeEnum,
  BountyExpectedOutputFormatEnum,
} from "@odin/core/types";

const scenarios = [
  {
    name: "Market Sentiment Analysis",
    description: `Create an AI agent that analyzes financial news articles to determine market sentiment toward specific stocks or sectors. The agent should process multiple news sources, extract sentiment signals, and provide actionable insights for traders.`,
    expectedOutput: {
      format: BountyExpectedOutputFormatEnum.parse("json"),
      schema: {
        type: "object",
        properties: {
          target_entities: {
            type: "array",
            items: {
              type: "string",
            },
          },
          overall_sentiment: {
            type: "object",
            properties: {
              score: {
                type: "number",
                minimum: -1,
                maximum: 1,
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
              },
              classification: {
                type: "string",
                enum: ["bullish", "neutral", "bearish"],
              },
            },
            entity_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  entity: {
                    type: "string",
                  },
                  sentiment_score: {
                    type: "number",
                    minimum: -1,
                    maximum: 1,
                  },
                  confidence: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                  },
                  classification: {
                    type: "string",
                    enum: ["bullish", "neutral", "bearish"],
                  },
                  key_factors: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  supporting_excerpts: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                required: [
                  "entity",
                  "sentiment_score",
                  "confidence",
                  "classification",
                  "key_factors",
                  "supporting_excerpts",
                ],
              },
            },
          },
          time_trend: {
            type: "object",
            properties: {
              period_start: {
                type: "string",
                format: "date-time",
              },
              period_end: {
                type: "string",
                format: "date-time",
              },
            },
            required: ["trend", "magnitude"],
          },
          trading_signals: {
            type: "object",
            properties: {
              recommendation: {
                type: "string",
                enum: ["buy", "hold", "sell"],
              },
              strength: {
                type: "number",
                minimum: 0,
                maximum: 1,
              },
              timeframe: {
                type: "string",
                enum: ["short", "medium", "long"],
              },
            },
            required: ["recommendation", "strength", "timeframe"],
          },
        },
        required: ["target_entities", "overall_sentiment", "trading_signals"],
      },
    },
    evaluationCriteria: {
      type: EvaluationCriteriaTypeEnum.parse("automated"),
      criteria: "Correlation with Actual Market Movements",
    },
    stubResponse: {
      target_entities: ["AAPL", "MSFT", "TSLA"],
      overall_sentiment: {
        score: 0.35,
        confidence: 0.78,
        classification: "bullish",
        entity_analysis: [
          {
            entity: "AAPL",
            sentiment_score: 0.56,
            confidence: 0.82,
            classification: "bullish",
            key_factors: [
              "Strong iPhone 16 sales",
              "Growing services revenue",
              "AI integration announcements",
            ],
            supporting_excerpts: [
              "iPhone 16 has exceeded analyst expectations by 12%",
              "Services revenue grew 18% year-over-year",
            ],
          },
          {
            entity: "MSFT",
            sentiment_score: 0.42,
            confidence: 0.75,
            classification: "bullish",
            key_factors: [
              "Azure cloud growth",
              "Copilot adoption",
              "Enterprise software demand",
            ],
            supporting_excerpts: [
              "Azure revenue increased 27% in constant currency",
              "Enterprise clients report 15% productivity gains with Copilot",
            ],
          },
          {
            entity: "TSLA",
            sentiment_score: -0.12,
            confidence: 0.68,
            classification: "neutral",
            key_factors: [
              "Model Y sales decline",
              "Factory efficiency improvements",
              "Competition in EV market",
            ],
            supporting_excerpts: [
              "Model Y sales down 5% quarter-over-quarter",
              "Factory automation improvements reduced production costs by 8%",
            ],
          },
        ],
      },
      time_trend: {
        period_start: "2025-03-01T00:00:00Z",
        period_end: "2025-04-01T00:00:00Z",
        trend: "upward",
        magnitude: 0.22,
      },
      trading_signals: {
        recommendation: "buy",
        strength: 0.65,
        timeframe: "medium",
      },
    },
  },
];

const main = async () => {
  const llmJudgeService = new LLMJudgeService();

  const { evaluationCriteria, expectedOutput, stubResponse } = scenarios[0];

  await llmJudgeService.orchestrateAgenticEvaluation(
    evaluationCriteria,
    expectedOutput,
  );

  // await llmJudgeService.executeWebSearch(
  //   {
  //     "id": "fetch_market_data",
  //     "type": "web_search",
  //     "description": "Retrieve historical market data for the target entities during the specified timeframe",
  //     "input": ["target_entities", "time_trend"],
  //     "output": "market_data",
  //     "search_parameters": {
  //       "query_template": "historical stock price data for {{target_entities}} from {{time_trend.period_start}} to {{time_trend.period_end}}"
  //     },
  //     "output_schema": "{\"type\":\"object\",\"properties\":{\"historical_prices\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"entity\":{\"type\":\"string\"},\"price_data\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"date\":{\"type\":\"string\",\"format\":\"date-time\"},\"price\":{\"type\":\"number\"},\"change_percentage\":{\"type\":\"number\"}},\"required\":[\"date\",\"price\",\"change_percentage\"]}}},\"required\":[\"entity\",\"price_data\"]}}},\"required\":[\"historical_prices\"]}"
  //   },
  //   stubResponse,
  // );
};

main();
