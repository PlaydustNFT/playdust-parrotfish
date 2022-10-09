import * as axios from "axios";

export class BatchRpcClient {
  endpoint: string;
  batchSize: number;
  constructor(endpoint, batchSize) {
    this.endpoint = endpoint;
    this.batchSize = batchSize;
  }

  generateGetAccountInfoRequests = (address:string , id: number) => {
    const getAccountInfo = 
    {
      "jsonrpc":"2.0",
      "id":id,
      "method":"getAccountInfo",
      "params":
      [
        address, 
          {
              "encoding":"jsonParsed"
          }
      ]
    }
    return getAccountInfo;
  };
  
  httpGetRequest = async (payload) => {
    return await this.genericHttpRequest("get", payload);
  };

  genericHttpRequest = async (httpMethod, payload) => {
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
