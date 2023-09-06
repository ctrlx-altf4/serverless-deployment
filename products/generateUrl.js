const uuid = require("uuid");
const AWS = require("aws-sdk");

module.exports.handler = async (event) => {
  const { REGION: region, BUCKET: bucket } = process.env;
  if (!region || !bucket) {
    throw new Error("REGION and BUCKET environment variables are required!");
  }

  const data = JSON.parse(event.body);

  const key = data.type;
  if (!key) {
    return {
      statusCode: 400,
      body: "File type is required",
    };
  }

  const S3 = new AWS.S3({ signatureVersion: "v4", region });

  const id = uuid.v4();
  const _key = id + "." + key;
  const params = {
    Bucket: bucket,
    Key: _key,
    Expires: 30,
  };

  try {
    const url = await S3.getSignedUrl("putObject", params);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": "*", // Required for cookies, authorization headers with HTTPS
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, key: _key, type: key }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify(error),
    };
  }
};
