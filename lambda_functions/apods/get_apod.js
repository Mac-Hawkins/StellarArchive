// Import the AWS SDK v3 SSM client
const { SSMClient, GetParametersCommand } = require("@aws-sdk/client-ssm");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
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

  // Keep this date because I want to get the APOD by date based on how they swipe. Don't change to ID.
  const apodDate = event.pathParameters.apodDate;

  let errorMsg;
  let apodResp = null;
  let apodData = null;
  let wasFound = false;
  try {
    // Try getting APOD from data base first.
    await dbClient.connect();
    apodResp = await dbClient.query("SELECT * FROM apods WHERE date = $1", [
      apodDate,
    ]);

    // If a APOD was found, apodResp.rows[0].id will have the APOD's data
    if (apodResp.rows && apodResp.rows.length > 0) {
      apodData = apodResp.rows[0];
      wasFound = true;
    } else {
      const client = new LambdaClient({});
      // Try getting APOD from NASA if unsuccessful.
      const nasaResponse = await client.send(
        new InvokeCommand({
          FunctionName: process.env.NASA_LAMBDA_NAME,
          Payload: JSON.stringify({ apodDate }),
        }),
      );
      // If a APOD was retrieved, nasaResponse will have the APOD's data
      if (nasaResponse != null) {
        const raw = Buffer.from(nasaResponse.Payload);
        apodData = JSON.parse(raw.toString());
        wasFound = true;

        // Record the APOD in my database
        const insertApodResult = await dbClient.query(
          "INSERT INTO apods (date, title, image_url, explanation) " +
            "VALUES ($1, $2, $3, $4) RETURNING *",
          [apodData.date, apodData.title, apodData.url, apodData.explanation],
        );

        // Reassign apodData to the new insertion in the database.
        // This is to keep data fields consistent when returning.
        apodData = insertApodResult.rows[0];
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
      body: JSON.stringify({ message: apodData }),
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "APOD not found." }),
    };
  }
};

// Function to get SSM params and
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
  } catch (error) {
    //errorSsm = error.message; // Commented out because sometimes this returns login info depending on error...
  } finally {
    return [client, errorSsm];
  }
}
