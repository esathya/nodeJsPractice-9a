const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
  }
};

initializeDBAndServer();

// user register API

app.post("/register", async (Request, Response) => {
  let { username, name, password, gender, location } = Request.body;
  let hashedPassword = await bcrypt.hash(password, 10);
  let selectUserQuery = `
  SELECT * FROM user
  WHERE username = '${username}';`;
  let dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    let createUserQuery = `
      INSERT INTO user (username,name,password,gender,location)
      VALUES(
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}'
      );`;
    if (password.length < 5) {
      Response.status(400);
      Response.send("Password is too short");
    } else {
      let newUser = await db.run(createUserQuery);
      Response.status(200);
      Response.send("User created successfully");
    }
  } else {
    Response.status(400);
    Response.send("User already exists");
  }
});

// user Login  API

app.post("/login", async (Request, Response) => {
  const { username, password } = Request.body;

  const selectUserQuery = `
    SELECT * FROM user
    WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    Response.status(400);
    Response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      Response.status(200);
      Response.send("Login success!");
    } else {
      Response.status(400);
      Response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (Request, Response) => {
  const { username, oldPassword, newPassword } = Request.body;
  const selectUserQuery = `
  SELECT * FROM user
  WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    Response.status(400);
    Response.send("User Not Registered");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      if (newPassword.length < 5) {
        Response.status(400);
        Response.send("Password is too short");
      } else {
        const encryptNewPassword = await bcrypt.hash(newPassword, 10);
        const updatePassword = `
        UPDATE user
        SET password = '${encryptNewPassword}'
        WHERE username = '${username}';`;
        await db.run(updatePassword);
        Response.status(200);
        Response.send("Password updated");
      }
    } else {
      Response.status(400);
      Response.send("Invalid current password");
    }
  }
});

module.exports = app;
