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

  // Parse the JSON body
  const body = JSON.parse(event.body);
  const date = body.date;
  const title = body.title;
  const imageUrl = body.image_url;
  const explanation = body.explanation;


  let errorMsg;
  let apodAlreadyExists = false;

  try {
    await dbClient.connect();
    
    // Query the RDS to see if the APOD already exists.
    let apodExists = await dbClient.query(
      `SELECT EXISTS (SELECT 1 FROM apods WHERE date = $1) AS apod_exists`,
      [date],
    );

    // If the apod doesn't already exist...
    if (!apodExists.rows[0].apod_exists) {
      // Insert the APOD.
      await dbClient.query(
        "INSERT INTO apods (date, title, image_url, explanation) " +
          "VALUES ($1, $2, $3, $4)",
        [date, title, imageUrl, explanation],
      );
    } else {
      apodAlreadyExists = true;
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

  if (apodAlreadyExists) {
    // Return a 409 conflict error stating so.
    return {
      statusCode: 409,
      body: JSON.stringify({ error: "APOD already exists" }),
    };
  } else {
    return {
      statusCode: 201,
      body: JSON.stringify({ message: "APOD cached", date }),
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
