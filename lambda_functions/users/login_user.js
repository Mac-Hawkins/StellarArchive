// Import the AWS SDK v3 SSM client
const { SSMClient, GetParametersCommand } = require("@aws-sdk/client-ssm");
const bcrypt = require("bcrypt"); // To hash passwords
const { Client } = require("pg");
const jwt = require("jsonwebtoken");

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

  await dbClient.connect();

  let errorMsg;
  let isValid;
  let userId;

  try {
    // Query the RDS to get the info of the username
    let res = await dbClient.query(`SELECT * FROM users WHERE username = $1`, [
      username,
    ]);

    // If the username doesn't already exist...
    if (res.rows && res.rows.length > 0) {
      let hashedPassword = res.rows[0].password;
      isValid = await bcrypt.compare(password, hashedPassword);
      userId = res.rows[0].id;
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

  // If user info matches, sign JWT to login.
  if (isValid) {
    const payload = { userId: userId, username };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    // 201 is created code.
    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Login successful. JWT:", token }),
    };
  } else {
    // Return a 409 conflict error stating so.
    return {
      statusCode: 409,
      body: JSON.stringify({ message: "User info doesn't match our records." }),
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