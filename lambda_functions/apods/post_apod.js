// Import the AWS SDK v3 SSM client
const { SSMClient, GetParametersCommand } = require("@aws-sdk/client-ssm");
const { Client } = require("pg");

// I'M DEPRECATING THIS AS THE GET APOD REQUEST WILL NOW DO THE POST
// DIRECTLY IF RETRIEVED FROM NASA. MAY DELETE.

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

  // Parse the JSON body
  const body = JSON.parse(event.body);
  const date = body.date;
  const title = body.title;
  const imageUrl = body.image_url;
  const explanation = body.explanation;
  let id; // should be set later to the ID of the newly cached APOD.

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
      const result = await dbClient.query(
        "INSERT INTO apods (date, title, image_url, explanation) " +
          "VALUES ($1, $2, $3, $4) RETURNING id",
        [date, title, imageUrl, explanation],
      );

      id = result.rows[0].id;
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
      body: JSON.stringify({ message: "APOD cached", date, apod_id: id }),
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
