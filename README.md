# aws_lambda

A simple lambda function that fetches reviews from Trustpilot's API and calculates a weighted average based on the age of the reviews


## Getting Started

If you want to download it and see how it works,  you can simply clone the repository and install the dependencies.
This is how to do it:

### Install node and npm

You must have node.js and
its package manager (npm) installed.  You can get them from [http://nodejs.org/](http://nodejs.org/).
To get the tools we depend upon `npm`, the node package manager.
You can then simply do from the root of the project:

```
$ npm install
```

### Run Lambda functions on your local machine
Lambda-local lets you test Amazon Lambda functions on your local machine with sample event data.
The context of the Lambda function is already loaded so you do not have to worry about it.
You can pass any event JSON object as you please.
```
$ npm install -g lambda-local

$ lambda-local -l index.js -h handler -e event.js

```

### Examine, develop, and have fun
Go crazy. As you notice, I have gitignored the config file, that holds the API key.
You can get one if you create a Trustpilot profile. The contents of the file:

```
var config = {
    trustpilot: {
        apikey : 'xxxxxxxxxxxxxxxxxxxxxxxxxxx',
        maxPerPage : 100
    },
    challenge: {
        maxReviews: 300,
        author: 'Nikos Papageorgiou'
    },
    errors: {
        error400: {
            status: 400,
            message: 'Please specify a domain'
        },
        error404: {
            status: 404,
            message: 'Business Unit was not found'
        }
    }
};

module.exports = config;
```

### Ready to deploy?
If so, follow these excellent tutorials:

[Make Synchronous Calls to Lambda Functions](http://docs.aws.amazon.com/apigateway/latest/developerguide/getting-started.html)(Valid at 08-Apr-2016)

[Creating a Deployment Package](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html)(Valid at 08-Apr-2016)


After you have your endpoints and function ready, follow this excellent advice on how to return custom status codes on errors:

[How to return a custom error object and status code from API Gateway with Lambda](http://kennbrodhagen.net/2016/03/09/how-to-return-a-custom-error-object-and-status-code-from-api-gateway-with-lambda/)(Valid at 08-Apr-2016)