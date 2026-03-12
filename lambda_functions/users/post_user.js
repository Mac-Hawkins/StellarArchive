// Import the AWS SDK v3 SSM client
const { SSMClient, GetParametersCommand } = require("@aws-sdk/client-ssm");
const bcrypt = require("bcrypt"); // To hash passwords
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
  const username = body.username;
  const password = body.password;
  let errorMsg;
  let userExists;

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
      await dbClient.query(
        "INSERT INTO users (username, password) VALUES ($1, $2)",
        [username, hashedPassword],
      );
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
    return {
      statusCode: 201,
      body: JSON.stringify({ message: "User created", username }),
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
