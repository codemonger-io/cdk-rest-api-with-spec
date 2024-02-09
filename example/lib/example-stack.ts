import * as path from 'path';
import {
  Stack,
  StackProps,
  aws_apigateway as apigateway,
  aws_lambda as lambda,
  aws_lambda_nodejs as nodejs,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { RestApiWithSpec, augmentAuthorizer } from 'cdk-rest-api-with-spec';

/**
 * Provisions a REST API that represents a modified subset of the Pet Store API.
 *
 * The OpenAPI 3.0 definition of the Pet Store API is available at
 * https://github.com/swagger-api/swagger-petstore/blob/master/src/main/resources/openapi.yaml
 */
export class ExampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const documentationVersion = '0.0.1';

    const api = new RestApiWithSpec(this, 'example-api', {
      description: 'Example of RestApiWithSpec',
      openApiInfo: {
        version: documentationVersion,
      },
      openApiOutputPath: 'openapi.json',
      deploy: true,
      deployOptions: {
        stageName: 'staging',
        description: 'Default stage',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 50,
      },
    });

    // authorizer
    const authorizer = augmentAuthorizer(
      new apigateway.TokenAuthorizer(
        this,
        'ExampleAuthorizer',
        {
          handler: new nodejs.NodejsFunction(this, 'authorizer', {
            description: 'Example authorizer',
            runtime: lambda.Runtime.NODEJS_18_X,
          }),
        },
      ),
      {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
      },
    );

    // validators
    // - full request validator
    const fullRequestValidator = new apigateway.RequestValidator(
      this,
      'FullRequestValidator',
      {
        restApi: api,
        validateRequestBody: true,
        validateRequestParameters: true,
      },
    );

    // models
    // - pet
    const petModel = api.addModel('PetModel', {
      description: 'A pet',
      contentType: 'application/json',
      schema: {
        schema: apigateway.JsonSchemaVersion.DRAFT4,
        title: 'pet',
        description: 'A pet',
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          id: {
            description: 'ID of the pet',
            type: apigateway.JsonSchemaType.INTEGER,
            format: 'int64',
            example: 123,
          },
          name: {
            description: 'Name of the pet',
            type: apigateway.JsonSchemaType.STRING,
            example: 'Monaka',
          },
          status: {
            description: 'Status of the pet',
            type: apigateway.JsonSchemaType.STRING,
            enum: ['available', 'pending', 'sold'],
            example: 'sold',
          },
        },
      },
    });
    // - array of pets
    const petArrayModel = api.addModel('PetArrayModel', {
      description: 'An array of pets',
      contentType: 'application/json',
      schema: {
        schema: apigateway.JsonSchemaVersion.DRAFT4,
        title: 'petArray',
        description: 'An array of pets',
        type: apigateway.JsonSchemaType.ARRAY,
        items: {
          modelRef: petModel,
        },
        example: [
          {
            id: 123,
            name: 'Monaka',
            status: 'sold',
          },
        ],
      },
    });

    // the root (/)
    // - GET
    api.root.addMethod(
      'GET',
      new apigateway.MockIntegration({
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': `{
                "message": "You got it right."
              }`,
            },
          },
        ],
      }),
      {
        operationName: 'getRoot',
        summary: 'Get root',
        description: 'Returns the root object',
        requestValidator: fullRequestValidator,
        methodResponses: [
          {
            statusCode: '200',
          },
        ],
      },
    );
    // /pet
    const pet = api.root.addResource('pet');
    // - POST
    pet.addMethod(
      'POST',
      new apigateway.MockIntegration({
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': `{
                "message": "Successfully added a new pet."
              }`
            },
          },
        ],
      }),
      {
        operationName: 'addNewPet',
        summary: 'Add pet',
        description: 'Adds a new pet to the store',
        authorizer,
        requestValidator: fullRequestValidator,
        requestModels: {
          'application/json': petModel,
        },
        methodResponses: [
          {
            statusCode: '200',
            description: 'Successful operation',
          },
          {
            statusCode: '405',
            description: 'Invalid input',
          },
        ],
      },
    );
    // /pet/findByStatus
    const findByStatus = pet.addResource('findByStatus');
    // - GET
    findByStatus.addMethod(
      'GET',
      new apigateway.MockIntegration({
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': `[
                {
                  "id": 123,
                  "name": "Monaka",
                  "status": "sold"
                }
              ]`
            },
          },
        ],
      }),
      {
        operationName: 'findPetsByStatus',
        summary: 'Finds Pets by status',
        description: 'Multiple status values can be provided with comma separated strings',
        requestValidator: fullRequestValidator,
        requestParameterSchemas: {
          'method.request.querystring.status': {
            description: 'Status values that need to be considered for filter',
            required: false,
            explode: true,
            schema: {
              type: 'string',
              enum: ['available', 'pending', 'sold'],
              default: 'available',
            },
          },
        },
        methodResponses: [
          {
            statusCode: '200',
            description: 'successful operation',
            responseModels: {
              'application/json': petArrayModel,
            },
          },
        ],
      },
    );
    // /pet/{petId}
    const petId = pet.addResource('{petId}', {
      defaultMethodOptions: {
        requestParameterSchemas: {
          'method.request.path.petId': {
            description: 'ID of pet',
            required: true,
            schema: {
              type: apigateway.JsonSchemaType.INTEGER,
              format: 'int64',
              example: 123,
            },
          },
        },
      },
    });
    // - GET
    petId.addMethod(
      'GET',
      new apigateway.MockIntegration({
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': `[
                {
                  "id": 123,
                  "name": "Monaka",
                  "status": "sold"
                }
              ]`
            },
          },
        ],
      }),
      {
        operationName: 'getPetById',
        summary: 'Find pet by ID',
        description: 'Returns a single pet',
        requestValidator: fullRequestValidator,
        methodResponses: [
          {
            statusCode: '200',
            description: 'successful operation',
            responseModels: {
              'application/json': petModel,
            },
          },
          {
            statusCode: '400',
            description: 'Invalid ID supplied',
          },
          {
            statusCode: '404',
            description: 'Pet not found',
          },
        ],
      },
    );
    // - POST
    petId.addMethod(
      'POST',
      new apigateway.MockIntegration(),
      {
        operationName: 'updatePetWithForm',
        summary: 'Updates a pet in the store with form data',
        description: '',
        authorizer,
        requestParameterSchemas: {
          // overrides the default method options
          'method.request.path.petId': {
            description: 'ID of pet that needs to be updated',
            required: true,
            schema: {
              type: apigateway.JsonSchemaType.INTEGER,
              format: 'int64',
              example: 123,
            },
          },
          'method.request.querystring.name': {
            description: 'Name of pet that needs to be updated',
            schema: {
              type: apigateway.JsonSchemaType.STRING,
            },
          },
          'method.request.querystring.status': {
            description: 'Status of pet that needs to be updated',
            schema: {
              type: apigateway.JsonSchemaType.STRING,
            },
          },
        },
        methodResponses: [
          {
            statusCode: '200',
            description: 'successful operation',
          },
          {
            statusCode: '405',
            description: 'Invalid input',
          },
        ],
      },
    );
  }
}
