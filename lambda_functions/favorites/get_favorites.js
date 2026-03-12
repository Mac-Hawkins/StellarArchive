// Import the AWS SDK v3 SSM client
const { SSMClient, GetParametersCommand } = require("@aws-sdk/client-ssm");
const { Client } = require("pg");

exports.handler = async (event) => {

  let errorSsm = ""
  let dbClient;
  [dbClient, errorSsm] = await configureDbConnection();

  // Return early if there was an issue.
  if (!dbClient)
  {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorSsm }),
    };
  }

  let errorMsg;
  let favorites = "";
  let wasFound = false;

  try {
    await dbClient.connect();

    // Get the userId from the URL
    const userId = event.pathParameters.userId;

    if (userId) {
      favorites = await dbClient.query(
        "SELECT * FROM favorites WHERE user_id = $1",
        [userId],
      );

      // If a favorite was found, result.rows[0].id will have one of the user's favorites.
      if (favorites.rows && favorites.rows.length > 0) {
        wasFound = true;
      }
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
  if (wasFound) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: favorites.rows }),
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "No favorites found for this user." }),
    };
  }
};

// Function to get SSM params and 
async function configureDbConnection()
{
  const input = { Names: [process.env.SSM_DB_HOST, process.env.SSM_DB_PORT, 
    process.env.SSM_DB_NAME, process.env.SSM_DB_USER, process.env.SSM_DB_PASSWORD], 
    WithDecryption: true };
    
  const dbParams = new GetParametersCommand(input);

  const ssmClient = new SSMClient({ region: process.env.MY_REGION }); // put in env var
  
  let client;
  let errorSsm;
  try {
    const data = await ssmClient.send(dbParams);

    // Figure out why it comes in this order...
  const dbHost = data.Parameters[0].Value;
  const dbName = data.Parameters[1].Value;
  const dbPassword = data.Parameters[2].Value;
  const dbPort = data.Parameters[3].Value;
  const dbUser = data.Parameters[4].Value;

  // Create client connection to RDS.
  client = new Client({
    host: dbHost,
    port: dbPort,
    database: dbName,
    user: dbUser,
    password: dbPassword,
  });

  
  }catch (error) {
    //errorSsm = error.message; // Commented out because sometimes this returns login info depending on error...
  } 
  finally {
    return [client, errorSsm];
  }
}