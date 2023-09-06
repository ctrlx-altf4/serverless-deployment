"use strict";

const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const params = {
  TableName: process.env.DYNAMODB_TABLE,
};

module.exports.handler = (event, context, callback) => {
  dynamoDb.scan(params, async (error, result) => {
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { "Content-Type": "text/plain" },
        body: "Couldn't get the data.",
      });
      return;
    }

    const _dataWithS3Url = result?.Items?.map(async (d) => {
      if (d.imageKey) {
        const _getUrl = await generateGetUrl(d.imageKey);
        return { ...d, imageUrl: _getUrl };
      }
      return { ...d };
    });

    const _finalData = await Promise.all(_dataWithS3Url);
    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(_finalData),
      headers: { "Content-Type": "application/json" },
    };
    callback(null, response);
  });
};

async function generateGetUrl(key) {
  const { REGION: region, BUCKET: bucket } = process.env;
  if (!region || !bucket) {
    throw new Error("REGION and BUCKET environment variables are required!");
  }

  const S3 = new AWS.S3({ signatureVersion: "v4", region });

  const params = {
    Bucket: bucket,
    Key: key,
    Expires: 3600,
  };
  return await S3.getSignedUrl("getObject", params);
}
