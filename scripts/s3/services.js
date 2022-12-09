import { S3Client, ListBucketsCommand, GetBucketTaggingCommand } from "@aws-sdk/client-s3";
import { RequiredTags, REGIONS } from "../consts.js";

export async function populateAllS3Buckets() {
  const s3Client = new S3Client({ region: 'us-east-1' });
  const data = await s3Client.send(new ListBucketsCommand({}));
  return data.Buckets
}

export function analyzeBucketTags({ bucket, tags, bucketData }) {
  const bucketTags = tags.TagSet

  if(bucketTags.length === 0) return null
  const bucketModelIndex = bucketData.findIndex(item => item.name === bucket)
  const bucketModel = bucketData.find(item => item.name === bucket)

  const missingTags = RequiredTags.filter(tag => !bucketTags.find(bucketTag => bucketTag.Key === tag))
  const extraTags = bucketTags.filter(bucketTag => !RequiredTags.find(tag => tag === bucketTag.Key))


  bucketModel.missingTags = missingTags || []
  bucketModel.extraTags = extraTags || []
  bucketModel.synced = true
  bucketData.splice(bucketModelIndex, 1, bucketModel)
}

export async function fetchBucketTags({ bucket, region, bucketData }) {
  try {
    const newS3Client = new S3Client({ region });
    const command = new GetBucketTaggingCommand({
      Bucket: bucket
    })
    let tags = await newS3Client.send(command)
    return await analyzeBucketTags({ bucket, tags: tags, bucketData })
  } catch(err) {
    // console.log('err', err)
  }
}

export async function populateAllS3BucketTags(buckets) {
  let bucketData = buckets.map((bucket) => ({ name: bucket.Name, tags: [], missingTags: []}))
  for (let region of REGIONS) {
    const filteredBuckets = buckets.filter(bucket => {
      let found = bucketData.find(item => item.name === bucket.Name)
      return !found.synced
    })
    console.log('count of missing buckets', filteredBuckets.length)
    for (let bucket of filteredBuckets) {
      await fetchBucketTags({ bucket: bucket.Name, region, bucketData })
    }
  }
  return bucketData
}