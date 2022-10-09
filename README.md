# Parrotfish - Playdust backend pipelines
This project contains source code and supporting files for the parrotfish backend pipeline applications and infrastructure.

Notion document about the project: 
https://www.notion.so/playdust/SAM-and-github-actions-pipelines-CICD-for-Parrotfish-59cc82e49f8e45ca8165cd9d5420d940

## Build and Deployment of Parrotfish modules
Each module directory contains application code specific to a phase of the Playdust data ingest and processing pipelines.
Each module automatically runs build, test, and deploy using SAM and github actions.

### .github/workflows/{module}.yaml
Defines a module's test, build, and deployment pipelines for github actions 
Github actions runs `sam build`, `sam deploy`, and other test, build, and deploy commands defined here.

### {module}/template.yaml
Declares associated aws infrastructure for each module via SAM

## About Parrotfish SAM Pipelines:
We are using SAM and github actions to automate deployment of the Parrotfish modules to testing and prod environments in AWS
To build and test these SAM applications locally, you will need the SAM cli:

Re SAM CLI from AWS:
The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To use the SAM CLI, you need the following tools.

* SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* [Python 3 installed](https://www.python.org/downloads/)
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

To build and deploy your application for the first time, run the following in your shell:

```bash
sam build --use-container
sam deploy --guided
```

The first command will build the source of your application. The second command will package and deploy your application to AWS, with a series of prompts:

* **Stack Name**: The name of the stack to deploy to CloudFormation. This should be unique to your account and region, and a good starting point would be something matching your project name.
* **AWS Region**: The AWS region you want to deploy your app to.
* **Confirm changes before deploy**: If set to yes, any change sets will be shown to you before execution for manual review. If set to no, the AWS SAM CLI will automatically deploy application changes.
* **Allow SAM CLI IAM role creation**: Many AWS SAM templates, including this example, create AWS IAM roles required for the AWS Lambda function(s) included to access AWS services. By default, these are scoped down to minimum required permissions. To deploy an AWS CloudFormation stack which creates or modifies IAM roles, the `CAPABILITY_IAM` value for `capabilities` must be provided. If permission isn't provided through this prompt, to deploy this example you must explicitly pass `--capabilities CAPABILITY_IAM` to the `sam deploy` command.
* **Save arguments to samconfig.toml**: If set to yes, your choices will be saved to a configuration file inside the project, so that in the future you can just re-run `sam deploy` without parameters to deploy changes to your application.

You can find your API Gateway Endpoint URL in the output values displayed after deployment.

## Use the SAM CLI to build and test locally

Build your application with the `sam build --use-container` command.

```bash
github-actions-with-aws-sam$ sam build --use-container
```

The SAM CLI installs dependencies defined in `hello_world/requirements.txt`, creates a deployment package, and saves it in the `.aws-sam/build` folder.

Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder in this project.

Run functions locally and invoke them with the `sam local invoke` command.

```bash
github-actions-with-aws-sam$ sam local invoke HelloWorldFunction --event events/event.json
```

The SAM CLI can also emulate your application's API. Use the `sam local start-api` to run the API locally on port 3000.

```bash
github-actions-with-aws-sam$ sam local start-api
github-actions-with-aws-sam$ curl http://localhost:3000/
```

The SAM CLI reads the application template to determine the API's routes and the functions that they invoke. The `Events` property on each function's definition includes the route and method for each path.

```yaml
      Events:
        HelloWorld:
          Type: Api
          Properties:
            Path: /hello
            Method: get
```

## Add a resource to your application
The application template uses AWS Serverless Application Model (AWS SAM) to define application resources. AWS SAM is an extension of AWS CloudFormation with a simpler syntax for configuring common serverless application resources such as functions, triggers, and APIs. For resources not included in [the SAM specification](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md), you can use standard [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) resource types.

## Fetch, tail, and filter Lambda function logs

To simplify troubleshooting, SAM CLI has a command called `sam logs`. `sam logs` lets you fetch logs generated by your deployed Lambda function from the command line. In addition to printing the logs on the terminal, this command has several nifty features to help you quickly find the bug.

`NOTE`: This command works for all AWS Lambda functions; not just the ones you deploy using SAM.

```bash
github-actions-with-aws-sam$ sam logs -n HelloWorldFunction --stack-name github-actions-with-aws-sam --tail
```

You can find more information and examples about filtering Lambda function logs in the [SAM CLI Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-logging.html).

## Tests

Tests are defined in the `tests` folder in this project. Use PIP to install the test dependencies and run tests.

```bash
github-actions-with-aws-sam$ pip install -r tests/requirements.txt --user
# unit test
github-actions-with-aws-sam$ python -m pytest tests/unit -v
# integration test, requiring deploying the stack first.
# Create the env variable AWS_SAM_STACK_NAME with the name of the stack we are testing
github-actions-with-aws-sam$ AWS_SAM_STACK_NAME=<stack-name> python -m pytest tests/integration -v
```

## Cleanup

To delete the sample application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
aws cloudformation delete-stack --stack-name github-actions-with-aws-sam
```

## Resources

See the [AWS SAM developer guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) for an introduction to SAM specification, the SAM CLI, and serverless application concepts.

Next, you can use AWS Serverless Application Repository to deploy ready to use Apps that go beyond hello world samples and learn how authors developed their applications: [AWS Serverless Application Repository main page](https://aws.amazon.com/serverless/serverlessrepo/)

## General Code Layout Guidelines
Code layout:
- tests/
    * Includes all unit tests
    * Unit tests should include tests of any new Entity objects introduced for this processor
    * Unit tests should include tests of any business logic introduced for this processor

- src/
    * Includes all source files which are specific to this task
    * Defines the `lambdaEntrypoint.ts` which includes the `handler()` function
    * Defines the `processorEntrypoint.ts` which includes the `processItem()` function

Shared code:
- <RepositoryRootDirectory>/shared/src
    - entity/
        * Includes all Entity objects which are used to read from/write to the Playdust entity db
    - service/
        * Includes any services for connecting with AWS back-end components;
        * For instance, dynamodb.ts includes instantiation of dynamodb client
    - consts
        * Includes all constants which will be used by multiple (all) processors or within shared code
    - types
        * Includes all type definitions, for example the `Entity` interface which all Entity model classes must implement
    - util
        * Includes any utilities used by shared code or multiple processors

Implementing a new processor:
    - Clone an existing processor from the processor's root directory (i.e. <RepositoryRootDirectory>/me-transaction-processor)
    - Update the `template.yaml` to have proper description, naming convetion & filter(s)
    - Clone .github/workflows/me-transaction-processor.yaml
    - Update any references to `me-transaction-processor`
    - Write unit tests
    - Write business logic
    - Remove any code specific to the `me-transaction-processor`

Building:
    Our build/bundling process is managed by webpack, as defined by the `webpack.config.ts`. This shouldn't need to be touched when adding a new processor, as long as we follow the standard of using the `lambdaEntrypoint::handler` to implement where our lambda should begin execution.
    - To build your program, run `yarn build`
    - The transpiled javascript will be placed in the `build/` directory (defined in `webpack.config.ts`)

Local testing:
    * Unit Testing *
        - Unit testing is required for any code which performs transformations on data
        - Ideally, we should abide by the Test Driven Development approach, in which our tests define our implementation
        - To run the tests, execute `$ yarn jest`
    * Local deployment via AWS SAM
        - create an event of desired type (see events/event-ddb.json for an example of a dynamodb stream event)
        - run `sam local invoke -e <EventFileName> --env-vars env.json`
        
# License

<p xmlns:dct="http://purl.org/dc/terms/">
  <a rel="license"
     href="http://creativecommons.org/publicdomain/zero/1.0/">
    <img src="https://licensebuttons.net/p/zero/1.0/88x31.png" style="border-style: none;" alt="CC0" />
  </a>
  <br />
  To the extent possible under law,
  <span rel="dct:publisher" resource="[_:publisher]">the person who associated CC0</span>
  with this work has waived all copyright and related or neighboring
  rights to this work.
</p>