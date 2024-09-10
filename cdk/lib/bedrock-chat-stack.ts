import { CfnOutput, RemovalPolicy, StackProps, IgnoreMode } from "aws-cdk-lib";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  HttpMethods,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { Auth } from "./constructs/auth";
import { Api } from "./constructs/api";
import { Database } from "./constructs/database";
import { Frontend } from "./constructs/frontend";
import { WebSocket } from "./constructs/websocket";
import * as cdk from "aws-cdk-lib";
import { UsageAnalysis } from "./constructs/usage-analysis";
import { TIdentityProvider, identityProvider } from "./utils/identity-provider";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";
import { BedrockKnowledgeBaseCodebuild } from "./constructs/bedrock-knowledge-base-codebuild";

export interface BedrockChatStackProps extends StackProps {
  readonly bedrockRegion: string;
  readonly webAclId: string;
  readonly identityProviders: TIdentityProvider[];
  readonly userPoolDomainPrefix: string;
  readonly publishedApiAllowedIpV4AddressRanges: string[];
  readonly publishedApiAllowedIpV6AddressRanges: string[];
  readonly allowedSignUpEmailDomains: string[];
  readonly autoJoinUserGroups: string[];
  readonly enableMistral: boolean;
  readonly enableKB: boolean;
  readonly embeddingContainerVcpu: number;
  readonly embeddingContainerMemory: number;
  readonly selfSignUpEnabled: boolean;
  readonly enableIpV6: boolean;
  readonly natgatewayCount: number;
}

export class BedrockChatStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BedrockChatStackProps) {
    super(scope, id, {
      description: "Bedrock Chat Stack (uksb-1tupboc46)",
      ...props,
    });

    // FIXME : 필요한지 확인
    const idp = identityProvider(props.identityProviders);


    // Bucket for source code
    const sourceBucket = new Bucket(this, "SourceBucketForCodeBuild", {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
      serverAccessLogsPrefix: "SourceBucketForCodeBuild",
    });
    new s3deploy.BucketDeployment(this, "SourceDeploy", {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, "../../"), {
          ignoreMode: IgnoreMode.GIT,
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/dev-dist/**",
            "**/.venv/**",
            "**/__pycache__/**",
            "**/cdk.out/**",
            "**/.vscode/**",
            "**/.DS_Store/**",
            "**/.git/**",
            "**/.github/**",
            "**/.mypy_cache/**",
            "**/examples/**",
            "**/docs/**",
            "**/.env",
            "**/.env.local",
            "**/.gitignore",
            "**/test/**",
            "**/tests/**",
          ],
        }),
      ],
      destinationBucket: sourceBucket,
    });

    // CodeBuild used for KnowledgeBase
    const bedrockKnowledgeBaseCodebuild = new BedrockKnowledgeBaseCodebuild(
      this,
      "BedrockKnowledgeBaseCodebuild",
      {
        sourceBucket,
      }
    );

    const frontend = new Frontend(this, "Frontend", {
      webAclId: props.webAclId,
      enableMistral: props.enableMistral,
      enableKB: props.enableKB,
      enableIpV6: props.enableIpV6,
    });

    const auth = new Auth(this, "Auth", {
      origin: frontend.getOrigin(),
      userPoolDomainPrefixKey: props.userPoolDomainPrefix,
      idp,
      allowedSignUpEmailDomains: props.allowedSignUpEmailDomains,
      autoJoinUserGroups: props.autoJoinUserGroups,
      selfSignUpEnabled: props.selfSignUpEnabled,
    });

    // FIXME : 필요한지 확인
    const largeMessageBucket = new Bucket(this, "LargeMessageBucket", {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
      serverAccessLogsPrefix: "LargeMessageBucket",
    });

    const database = new Database(this, "Database", {
      // Enable PITR to export data to s3
      pointInTimeRecovery: true,
    });

    const usageAnalysis = new UsageAnalysis(this, "UsageAnalysis", {
      sourceDatabase: database,
    });

    const backendApi = new Api(this, "BackendApi", {
      database: database.table,
      auth,
      bedrockRegion: props.bedrockRegion,
      tableAccessRole: database.tableAccessRole,
      bedrockKnowledgeBaseProject: bedrockKnowledgeBaseCodebuild.project,
      usageAnalysis,
      largeMessageBucket,
      enableMistral: props.enableMistral,
    });

    // For streaming response
    const websocket = new WebSocket(this, "WebSocket", {
      database: database.table,
      tableAccessRole: database.tableAccessRole,
      websocketSessionTable: database.websocketSessionTable,
      auth,
      bedrockRegion: props.bedrockRegion,
      largeMessageBucket,
      enableMistral: props.enableMistral,
    });
    frontend.buildViteApp({
      backendApiEndpoint: backendApi.api.apiEndpoint,
      webSocketApiEndpoint: websocket.apiEndpoint,
      userPoolDomainPrefix: props.userPoolDomainPrefix,
      enableMistral: props.enableMistral,
      enableKB: props.enableKB,
      auth,
      idp,
    });

    new CfnOutput(this, "FrontendURL", {
      value: frontend.getOrigin(),
    });
    new CfnOutput(this, "ConversationTableName", {
      value: database.table.tableName,
      exportName: "BedrockClaudeChatConversationTableName",
    });
    new CfnOutput(this, "TableAccessRoleArn", {
      value: database.tableAccessRole.roleArn,
      exportName: "BedrockClaudeChatTableAccessRoleArn",
    });
    new CfnOutput(this, "LargeMessageBucketName", {
      value: largeMessageBucket.bucketName,
      exportName: "BedrockClaudeChatLargeMessageBucketName",
    });
  }
}
