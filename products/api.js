"use strict";

const uuid = require("uuid");
const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  const error = [];
  if (!data.title) {
    error.push({ title: "Title is required." });
  }
  if (!data.description) {
    error.push({ description: "Description is required." });
  }
  if (!data.price) {
    error.push({ price: "Price is required." });
  }
  if (!data.imageKey) {
    error.push({ imageKey: "Image key is required" });
  }
  if (error.length) {
    callback(null, {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(error),
    });
  }

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id: uuid.v4(),
      title: data.title,
      description: data.description,
      imageKey: data.imageKey,
      price: data.price,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };

  // write the todo to the database
  dynamoDb.put(params, (error) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { "Content-Type": "text/plain" },
        body: "Couldn't create the todo item.",
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 201,
      body: JSON.stringify(params.Item),
      headers: { "Content-Type": "application/json" },
    };
    callback(null, response);
  });
};
