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

  // Parse the JSON body
  const body = JSON.parse(event.body);
  const apodId = body.apod_id;

  let errorMsg;
  let wasCreated = false;
  let alreadyExists = false; // shouldn't be true but I'll check for testing purposes.
  let id; // should be set to the id of the newly created favorite.

  try {
    await dbClient.connect();

    // Get the userId from the URL
    const userId = event.pathParameters.userId;

    // If a user was found
    if (userId) {
      // Query the RDS to see if the username's favorite already exists.
      let favoriteExists = await dbClient.query(
        `SELECT EXISTS (SELECT 1 FROM favorites WHERE user_id = $1 AND apod_id = $2) AS favorite_exists`,
        [userId, apodId],
      );

      // If the favorite doesn't already exist
      if (!favoriteExists.rows[0].favorite_exists) {
        // Insert the favorites.
        const result = await dbClient.query(
          "INSERT INTO favorites (user_id, apod_id) " +
            "VALUES ($1, $2) RETURNING id",
          [userId, apodId],
        );

        id = result.rows[0].id;

        wasCreated = true;
      } else {
        alreadyExists = true;
      }
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

  if (alreadyExists) {
    return {
      statusCode: 409,
      body: JSON.stringify({ message: "Favorite already exists." }),
    };
  }

  if (wasCreated) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Favorite has been saved.",
        favorite_id: id,
      }),
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "User was not found." }),
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
