import { LambdaClient, ListFunctionsCommand, ListTagsCommand } from "@aws-sdk/client-lambda";
import { RequiredTags, REGIONS } from "../consts.js";


export async function populateAllLambdaFunctions() {
  const lambdaClient = new LambdaClient({ region: 'us-east-1' });
  const data = await lambdaClient.send(new ListFunctionsCommand({}));
  return data.Functions
}

export async function fetchLambdaTags({ lambda, region, lambdaData }) {
  try {
    const newLambdaClient = new LambdaClient({ region });
    const command = new ListTagsCommand({
      Resource: lambda
    })
    let tags = await newLambdaClient.send(command)
    return await analyzeLambdaTags({ lambda, tags: tags, lambdaData })
  } catch(err) {
    // console.log('err', err)
  }
}

export function analyzeLambdaTags({ lambda, tags, lambdaData }) {
  const lambdaTags = Object.keys(tags.Tags)

  if(lambdaTags.length === 0) return null
  const lambdaModelIndex = lambdaData.findIndex(item => item.name === lambda)
  const lambdaModel = lambdaData.find(item => item.name === lambda)
  const missingTags = RequiredTags.filter(tag => !lambdaTags.find(lambdaTag => lambdaTag.Key === tag))
  const extraTags = lambdaTags.filter(lambdaTag => !RequiredTags.find(tag => tag === lambdaTag.Key))

  lambdaModel.missingTags = missingTags || []
  lambdaModel.extraTags = extraTags || []
  lambdaModel.synced = true
  lambdaData.splice(lambdaModelIndex, 1, lambdaModel)
}

export async function populateAllLambdaTags(lambdas) {
  let lambdaData = lambdas.map((lambda) => ({ name: lambda.FunctionArn, tags: [], missingTags: []}))
  for (let region of REGIONS) {
    const filteredLambdas = lambdas.filter(lambda => {
      let found = lambdaData.find(item => item.name === lambda.FunctionArn)
      return !found.synced
    })
    console.log('count of missing lambdas', filteredLambdas.length)
    for (let lambda of filteredLambdas) {
      await fetchLambdaTags({ lambda: lambda.FunctionArn, region, lambdaData })
    }
  }
  return lambdaData
}