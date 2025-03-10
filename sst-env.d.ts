/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */
import "sst"
export {}
import "sst"
declare module "sst" {
  export interface Resource {
    "AI": {
      "anthropicApiKey": string
      "mistralApiKey": string
      "openaiApiKey": string
      "type": "sst.sst.Linkable"
    }
    "API": {
      "name": string
      "type": "sst.aws.Function"
      "url": string
    }
    "AnthropicApiKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "ApiRouter": {
      "type": "sst.aws.Router"
      "url": string
    }
    "Clerk": {
      "clerkJwks": string
      "clerkPublishableKey": string
      "clerkSecretKey": string
      "type": "sst.sst.Linkable"
    }
    "ClerkJWKS": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "ClerkPublishableKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "ClerkSecretKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "DATABASE": {
      "database": string
      "host": string
      "password": string
      "type": "sst.sst.Linkable"
      "user": string
    }
    "DatabaseHost": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "DatabasePassword": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "MistralApiKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "OpenaiApiKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "VPC": {
      "bastion": string
      "type": "sst.aws.Vpc"
    }
    "WEB": {
      "type": "sst.aws.SolidStart"
      "url": string
    }
    "ZERO": {
      "service": string
      "type": "sst.aws.Service"
      "url": string
    }
  }
}
