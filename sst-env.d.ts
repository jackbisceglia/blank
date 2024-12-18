/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */
import "sst"
export {}
import "sst"
declare module "sst" {
  export interface Resource {
    "API": {
      "name": string
      "type": "sst.aws.Function"
      "url": string
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
    "WEB": {
      "type": "sst.aws.SolidStart"
      "url": string
    }
  }
}
