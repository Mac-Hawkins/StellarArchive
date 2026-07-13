// Import the AWS SDK v3 SSM client
const { SSMClient, GetParametersCommand } = require("@aws-sdk/client-ssm");
const { Client } = require("pg");

exports.handler = async (event) => {
  let errorSsm = "";
  let dbClient;
  [dbClient, errorSsm] = await configureDbConnection();

  // Return early if there was an issue.
  if (!dbClient) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorSsm }),
    };
  }

  // Get the apodId from the URL
  const apodId = event.pathParameters.apodId;

  let errorMsg;
  let commentsResp = "";
  let commentsExist = false;
  try {
    await dbClient.connect();
    commentsResp = await dbClient.query(
      "SELECT users.username, comments.* FROM comments JOIN users ON comments.user_id = users.id WHERE apod_id = $1 ORDER BY comments.created_at ASC;",
      [apodId],
    );

    // If the APOD has comments, commentsResp.rows[0].id will have some comment data
    if (commentsResp.rows && commentsResp.rows.length > 0) {
      commentsExist = true;
    }
  } catch (error) {
    errorMsg = error.message;
  } finally {
    await dbClient.end();
  }

  if (errorMsg) {
    return {
      statusCode: 409,
      body: JSON.stringify({ error: errorMsg }),
    };
  }

  if (commentsExist) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: commentsResp.rows }),
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "APOD has no comments." }),
    };
  }
};

// Function to get SSM params and configure the database connection.
async function configureDbConnection() {
  const input = {
    Names: [
      process.env.SSM_DB_HOST,
      process.env.SSM_DB_PORT,
      process.env.SSM_DB_NAME,
      process.env.SSM_DB_USER,
      process.env.SSM_DB_PASSWORD,
    ],
    WithDecryption: true,
  };

  const dbParams = new GetParametersCommand(input);

  const ssmClient = new SSMClient({ region: process.env.MY_REGION });

  let client;
  let errorSsm;
  try {
    const data = await ssmClient.send(dbParams);

    // Initialize empty object
    const params = {};

    // Build lookup by name
    data.Parameters.forEach((p) => {
      params[p.Name] = p.Value;
    });

    // Get the values from the params object using the environment variable names
    const dbHost = params[process.env.SSM_DB_HOST];
    const dbName = params[process.env.SSM_DB_NAME];
    const dbPassword = params[process.env.SSM_DB_PASSWORD];
    const dbPort = params[process.env.SSM_DB_PORT];
    const dbUser = params[process.env.SSM_DB_USER];

    // Create client connection to RDS.
    client = new Client({
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      password: dbPassword,
    });
  } catch (error) {
    console.error("Error retrieving SSM parameters.", error);
    // Originally assigned this to error but sometimes it returned login info depending on error,
    // so I changed it to a generic error message.
    errorSsm = "Error retrieving SSM parameters.";
  } finally {
    return [client, errorSsm];
  }
}
