import * as axios from "axios";
import { logger } from "./logger";

export class BatchRpcClient {
  endpoint: any;
  batchSize: any;
  constructor(endpoint, batchSize) {
    this.endpoint = endpoint;
    this.batchSize = batchSize;
  }

  // not actually "sync", but returns list of all responses instead via callbacks
  syncHttpPostRequest = async (payload) => {
    logger.debug(`httpPostRequest for ${payload.length} items`);
    const responses = [];
    const promises = [];
    let batch = [];
    for (const item in payload) {
      batch.push(payload[item]);
      if (batch.length >= this.batchSize) {
        // dispatch request
        const promise = this.genericHttpRequest("post", batch);
        promise.then((response) => {
          responses.push(response);
        });
        promises.push(promise);
        batch = [];
      }
    }
    if (batch.length > 0) {
      const promise = this.genericHttpRequest("post", batch);
      promise.then((response) => {
        responses.push(response);
      });
      promises.push(promise);
    }
    await Promise.all(promises);
    return responses;
  };

  // feeds data for processing via callback methods
  httpPostRequest = async (payload, onResponseCallback, onCompleteCallback) => {
    logger.debug(`httpPostRequest for ${payload.length} items`);
    let batch = [];
    const promises = [];
    for (const item in payload) {
      batch.push(payload[item]);
      if (batch.length >= this.batchSize) {
        const promise = this.genericHttpRequest("post", batch);
        promise.then((response) => {
          onResponseCallback(response);
        });
        promises.push(promise);
        batch = [];
      }
    }
    if (batch.length > 0) {
      const promise = this.genericHttpRequest("post", batch);
      promise.then((response) => {
        onResponseCallback(response);
      });
      promises.push(promise);
    }
    await Promise.all(promises);
    onCompleteCallback();
  };

  httpGetRequest = async (payload) => {
    return await this.genericHttpRequest("get", payload);
  };

  genericHttpRequest = async (httpMethod, payload) => {
    logger.debug(`genericHttpRequest for ${payload.length} items`);
    try {
      const response = await axios.default({
        url: this.endpoint,
        method: httpMethod,
        headers: {
          "content-type": "application/json",
        },
        data: payload,
      });
      return response.data;
    } catch (error) {
      console.error("ERROR", error.response.data);
    }
  };
}
