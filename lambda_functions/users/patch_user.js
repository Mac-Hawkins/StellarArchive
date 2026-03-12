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
  const currPassword = body.current_password;
  const newPassword = body.new_password;

  let errorMsg;
  let wasUpdated = false;

  try {

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, Number(process.env.SALT_ROUNDS));
  
    await dbClient.connect();
    // Get the userId from the URL
    const userId = event.pathParameters.userId;

    // If an id was found...
    if (userId) {
      let res1 = await dbClient.query("SELECT * FROM users WHERE id = $1", [
        userId,
      ]);
      

      if (res1.rows && res1.rows.length > 0) {
        let resPass = res1.rows[0].password;

        // Compares plain text password with hashed password to see if the dehashed pass would be the same as plaintext.
        let doesMatch = await bcrypt.compare(currPassword, resPass);

        if (doesMatch) {
          // Update the password.
          let res2 = await dbClient.query(
            "UPDATE users SET password = $1 WHERE id = $2 RETURNING password",
            [hashedNewPassword, userId],
          );
          // If a row was updated, result.rows[0].id will have the deleted users's password
          if (res2.rows && res2.rows.length > 0) {
            // update successful
            wasUpdated = true;
          }
        }
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

  if (wasUpdated) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Password was updated." }),
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Password was not able to be updated." }),
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