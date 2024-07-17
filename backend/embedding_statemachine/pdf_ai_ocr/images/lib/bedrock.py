# -*- coding: utf-8 -*-
from typing import Collection
from aws_lambda_powertools import Logger
import boto3
from botocore.config import Config
import json
from lib.s3 import get_image_content_type

logger = Logger()

bedrock = boto3.client(service_name="bedrock-runtime", region_name="us-west-2",
  config=Config(
    connect_timeout=600,
    read_timeout=600,
    retries={
      "mode": "standard",
      "total_max_attempts": 3,
    }
  )
)

def run_multi_modal_prompt(model_id: str, messages, max_tokens: int):
  body = json.dumps(
    {
      "anthropic_version": "bedrock-2023-05-31",
      "max_tokens": max_tokens,
      "messages": messages,
      "temperature": 0.6,
      "top_p": 0.999,
      "top_k": 250
    }
  )

  response = bedrock.invoke_model(
    body=body, modelId=model_id)
  response_body = json.loads(response.get('body').read())

  return response_body

def get_base64_image_for_bedrock_content(base64_image: str) -> dict[str, Collection[str]]:
    # コンテンツタイプの自動判定
    content_type: str = get_image_content_type(base64_image)

    return (
      {
        "type": "image",
        "source": {
          "type": "base64",
          "media_type": content_type,
          "data": base64_image
        }
      }
    )


def get_model_id(model: str) -> str:
  # Ref: https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids-arns.html
  if model == "claude-v2":
      return "anthropic.claude-v2:1"
  elif model == "claude-instant-v1":
      return "anthropic.claude-instant-v1"
  elif model == "claude-v3-sonnet":
      return "anthropic.claude-3-sonnet-20240229-v1:0"
  elif model == "claude-v3-haiku":
      return "anthropic.claude-3-haiku-20240307-v1:0"
  elif model == "claude-v3-opus":
      return "anthropic.claude-3-opus-20240229-v1:0"
  elif model == "claude-v3.5-sonnet":
      return "anthropic.claude-3-5-sonnet-20240620-v1:0"
  elif model == "mistral-7b-instruct":
      return "mistral.mistral-7b-instruct-v0:2"
  elif model == "mixtral-8x7b-instruct":
      return "mistral.mixtral-8x7b-instruct-v0:1"
  elif model == "mistral-large":
      return "mistral.mistral-large-2402-v1:0"
  else:
      raise NotImplementedError()