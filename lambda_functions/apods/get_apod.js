// Import the AWS SDK v3 SSM client
const { SSMClient, GetParametersCommand } = require("@aws-sdk/client-ssm");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
const { Client } = require("pg");

exports.handler = async (event) => {
  //==================================
  // INITIALIZE DATABASE CONNECTION
  //==================================
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

  //==================================
  // EXTRACT THE APOD DATE AND INITIALIZE VARIABLES.
  //==================================

  const apodDate = event.pathParameters.apodDate;

  let errorMsg;
  let dbResp = null;
  let apodData = null;
  let wasFound = false;

  try {
    //==================================
    // ATTEMPT APOD RETRIEVAL FROM DB.
    //==================================

    // Try getting APOD from database first.
    await dbClient.connect();
    dbResp = await dbClient.query("SELECT * FROM apods WHERE date = $1", [
      apodDate,
    ]);

    // If a APOD was found, dbResp.rows[0].id will have the APOD's data
    if (dbResp.rows && dbResp.rows.length > 0) {
      apodData = dbResp.rows[0];
      wasFound = true;
    } else {
      //==================================
      // ATTEMPT APOD RETRIEVAL FROM NASA.
      //==================================

      // Try getting APOD from NASA if unsuccessful.
      const client = new LambdaClient({ region: process.env.MY_REGION });
      const nasaResp = await client.send(
        new InvokeCommand({
          FunctionName: process.env.NASA_LAMBDA_NAME,
          Payload: JSON.stringify({ apodDate }),
        }),
      );

      // Apparently the LambdaClient can return a 200 status code and not throw and error even if the Lambda function itself failed,
      // so we need to check for FunctionError as well.
      if (nasaResp.FunctionError) {
        throw new Error(
          `Failed to retrieve APOD from NASA Lambda. Error: ${nasaResp.FunctionError}`,
        );
      }
      // If a APOD was retrieved, nasaResp will have the APOD's data
      if (nasaResp != null && nasaResp.Payload != null) {
        const raw = Buffer.from(nasaResp.Payload);
        apodData = JSON.parse(raw.toString());
        wasFound = true;

        //==================================
        // CACHE APOD.
        //==================================

        // Record the APOD in my database, do nothing if it already exists (ON CONFLICT DO NOTHING).
        const insertApodResult = await dbClient.query(
          `INSERT INTO apods (date, title, image_url, explanation)
            VALUES ($1, $2, $3, $4) 
            ON CONFLICT (date) DO NOTHING
            RETURNING *`,
          [apodData.date, apodData.title, apodData.url, apodData.explanation],
        );

        // Retrieve the APOD from the database if it wasn't able to be inserted, as it may have been inserted by another process.
        // This is basically an edge case that I shouldn't encounter, but could happen if two or more users are swiping through the
        // APODs at the same time and the APOD is not in the database yet.
        if (insertApodResult.rows && insertApodResult.rows.length === 0) {
          const existingApod = await dbClient.query(
            "SELECT * FROM apods WHERE date = $1",
            [apodDate],
          );
          apodData = existingApod.rows[0];
        } else {
          // Reassign apodData to the new insertion in the database.
          // This is to keep data fields consistent when returning.
          apodData = insertApodResult.rows[0];
        }
      }
    }
  } catch (error) {
    errorMsg = error.message;
  } finally {
    await dbClient.end();
  }

  //==================================
  // RETURN RESPONSE
  //==================================

  // Return 500 if there was an error with the database or NASA API.
  if (errorMsg) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMsg }),
    };
  }

  // APOD was found so return 200.
  if (wasFound) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: apodData }),
    };
  }
  // Else, APOD was not found so return 404.
  else {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "APOD not found." }),
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
