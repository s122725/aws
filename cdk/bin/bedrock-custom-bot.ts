import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { BedrockCustomBotStack } from "../lib/bedrock-custom-bot-stack";
import {
  getEmbeddingModel,
  getChunkingStrategy,
  getAnalyzer,
} from "../lib/utils/bedrock-knowledge-base-args";

const app = new cdk.App();

const PK: string = process.env.PK!;
const SK: string = process.env.SK!;
const BEDROCK_CLAUDE_CHAT_DOCUMENT_BUCKET_NAME: string =
  process.env.BEDROCK_CLAUDE_CHAT_DOCUMENT_BUCKET_NAME!;
const KNOWLEDGE: string = process.env.KNOWLEDGE!;
const BEDROCK_KNOWLEDGE_BASE: string = process.env.BEDROCK_KNOWLEDGE_BASE!;
const BEDROCK_GUARDRAILS: string = process.env.BEDROCK_GUARDRAILS!;

console.log("PK: ", PK);
console.log("SK: ", SK);
console.log(
  "BEDROCK_CLAUDE_CHAT_DOCUMENT_BUCKET_NAME: ",
  BEDROCK_CLAUDE_CHAT_DOCUMENT_BUCKET_NAME
);
console.log("KNOWLEDGE: ", KNOWLEDGE);
console.log("BEDROCK_KNOWLEDGE_BASE: ", BEDROCK_KNOWLEDGE_BASE);
console.log("BEDROCK_GUARDRAILS: ", BEDROCK_GUARDRAILS)

const ownerUserId: string = PK;
const botId: string = SK.split("#")[2];
const knowledgeBase = JSON.parse(BEDROCK_KNOWLEDGE_BASE);
const knowledge = JSON.parse(KNOWLEDGE);
const guardrails = JSON.parse(BEDROCK_GUARDRAILS)
const existingS3Urls: string[] = knowledge.s3_urls.L.map(
  (s3Url: any) => s3Url.S
);

console.log("ownerUserId: ", ownerUserId);
console.log("botId: ", botId);
console.log("knowledgeBase: ", knowledgeBase);
console.log("knowledge: ", knowledge);
console.log("guardrails: ", guardrails);
console.log("existingS3Urls: ", existingS3Urls);

const embeddingsModel = getEmbeddingModel(knowledgeBase.embeddings_model.S);
const chunkingStrategy = getChunkingStrategy(knowledgeBase.chunking_strategy.S);
const maxTokens: number | undefined = knowledgeBase.max_tokens
  ? Number(knowledgeBase.max_tokens.N)
  : undefined;
const instruction: string | undefined = knowledgeBase.instruction
  ? knowledgeBase.instruction.S
  : undefined;
const analyzer = knowledgeBase.open_search.M.analyzer.M
  ? getAnalyzer(knowledgeBase.open_search.M.analyzer.M)
  : undefined;
const overlapPercentage: number | undefined = knowledgeBase.overlap_percentage
  ? Number(knowledgeBase.overlap_percentage.N)
  : undefined;

const is_guardrail_enabled: boolean | undefined = guardrails.is_guardrail_enabled
  ? Boolean(guardrails.is_guardrail_enabled.BOOL)
  : undefined;
const hateThreshold: number | undefined = guardrails.hate_threshold
  ? Number(guardrails.hate_threshold.N)
  : undefined;
const insultsThreshold: number | undefined = guardrails.insults_threshold
  ? Number(guardrails.insults_threshold.N)
  : undefined;
const sexualThreshold: number | undefined = guardrails.sexual_threshold
  ? Number(guardrails.sexual_threshold.N)
  : undefined;
const violenceThreshold: number | undefined = guardrails.violence_threshold
  ? Number(guardrails.violence_threshold.N)
  : undefined;
const misconductThreshold: number | undefined = guardrails.misconduct_threshold
  ? Number(guardrails.misconduct_threshold.N)
  : undefined;
const relevanceThreshold: number | undefined = guardrails.relevance_threshold
  ? Number(guardrails.relevance_threshold.N)
  : undefined;
const guardrailArn: number |  undefined = guardrails.guardrail_arn
  ? Number(guardrails.guardrail_arn.N)
  : undefined;
const guardrailVersion: number | undefined = guardrails.guardrail_version
  ? Number(guardrails.guardrail_version.N)
  : undefined;

console.log("embeddingsModel: ", embeddingsModel);
console.log("chunkingStrategy: ", chunkingStrategy);
console.log("maxTokens: ", maxTokens);
console.log("instruction: ", instruction);
console.log("is_guardrail_enabled: ", is_guardrail_enabled);
console.log("hateThreshold: ", hateThreshold);
console.log("insultsThreshold: ", insultsThreshold);
console.log("sexualThreshold: ", sexualThreshold);
console.log("violenceThreshold: ", violenceThreshold);
console.log("misconductThreshold: ", misconductThreshold);
console.log("relevanceThreshold: ", relevanceThreshold);
console.log("guardrailArn: ", guardrailArn);
console.log("guardrailVersion: ", guardrailVersion);

if (analyzer) {
  console.log(
    "Analyzer: ",
    JSON.stringify(knowledgeBase.open_search.M.analyzer, null, 2)
  );
} else {
  console.log("Analyzer is undefined or null.");
}

console.log("overlapPercentage: ", overlapPercentage);

const bedrockCustomBotStack = new BedrockCustomBotStack(
  app,
  `BrChatKbStack${botId}`,
  {
    ownerUserId,
    botId,
    embeddingsModel,
    bedrockClaudeChatDocumentBucketName:
      BEDROCK_CLAUDE_CHAT_DOCUMENT_BUCKET_NAME,
    chunkingStrategy,
    existingS3Urls,
    maxTokens,
    instruction,
    analyzer,
    overlapPercentage,
    is_guardrail_enabled,
    hateThreshold,
    insultsThreshold,
    sexualThreshold,
    violenceThreshold,
    misconductThreshold,
    relevanceThreshold,
    guardrailArn,
    guardrailVersion
  }
);
