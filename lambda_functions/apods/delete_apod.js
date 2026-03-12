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


  // Get the apodId from the URL
  const apodId = event.pathParameters.apodId;

  let errorMsg;
  let wasDeleted = false;

  try {
    await dbClient.connect();
    // Delete the apod.
    let res = await dbClient.query(
      "DELETE FROM apods WHERE id = $1 RETURNING date",
      [apodId],
    );

    // If a row was deleted, result.rows[0].id will have the deleted apod's date
    if (res.rows && res.rows.length > 0) {
      // deletion successful
      wasDeleted = true;
    }
  } catch (error) {
    errorMsg = error.message;
  } finally {
    dbClient.end();
  }

  if (errorMsg) {
    return {
      statusCode: 409,
      body: JSON.stringify({ error: errorMsg }),
    };
  }

  if (wasDeleted) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "APOD was deleted." }),
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "APOD not found." }),
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