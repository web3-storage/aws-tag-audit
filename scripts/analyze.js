#!/bin/bash
import fs from "node:fs"
import { populateAllS3Buckets, populateAllS3BucketTags } from "./s3/services.js";
import { populateAllLambdaFunctions, populateAllLambdaTags } from "./lambda/services.js";

export const run = async () => {
  try {
    let reportsDir = './reports'
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }
    let buckets = await populateAllS3Buckets()
    let tags = await populateAllS3BucketTags(buckets)
    await fs.writeFileSync(`${reportsDir}/s3Tags.json`, JSON.stringify(tags, null, 2))

    let funcs = await populateAllLambdaFunctions()
    let lambdaTags = await populateAllLambdaTags(funcs)
    await fs.writeFileSync(`${reportsDir}/lambdaTags.json`, JSON.stringify(lambdaTags, null, 2))

  } catch (err) {
    console.log("Error", err);
  }
};
run();