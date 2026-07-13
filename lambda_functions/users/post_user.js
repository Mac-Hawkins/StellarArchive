// Import the AWS SDK v3 SSM client
const { SSMClient, GetParametersCommand } = require("@aws-sdk/client-ssm");
const bcrypt = require("bcrypt"); // To hash passwords
const { Client } = require("pg");
const jwt = require("jsonwebtoken");

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
  const username = body.username;
  const password = body.password;
  let errorMsg;
  let userExists;
  let userId;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.SALT_ROUNDS, 10),
    );

    await dbClient.connect();

    // Query the RDS to see if the username already exists.
    userExists = await dbClient.query(
      `SELECT EXISTS (SELECT 1 FROM users WHERE username = $1) AS user_exists`,
      [username],
    );

    // If the username doesn't already exist...
    if (!userExists.rows[0].user_exists) {
      // Insert the user.
      const res = await dbClient.query(
        "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
        [username, hashedPassword],
      );

      if (res.rows && res.rows.length > 0) {
        userId = res.rows[0].id;
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

  // If the username already exists...
  if (userExists.rows[0].user_exists) {
    // Return a 409 conflict error stating so.
    return {
      statusCode: 409,
      body: JSON.stringify({ error: "User already exists" }),
    };
  } else {
    const payload = { userId: userId, username };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "User created",
        username,
        userId,
        token,
      }),
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
