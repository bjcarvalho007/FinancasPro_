import admin from "firebase-admin";
import fs from "fs";

// Initialize Firebase Admin the same way as in server.ts
function initAdmin() {
  if (admin.apps.length > 0) return;
  
  if (fs.existsSync("./firebase-applet-config.json")) {
    const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
    admin.initializeApp({
      projectId: config.projectId,
      credential: admin.credential.applicationDefault()
    });
    console.log("Firebase initialized with project id:", config.projectId);
  } else {
    admin.initializeApp();
    console.log("Firebase initialized with default credential");
  }
}

async function run() {
  initAdmin();
  const db = admin.firestore();
  
  console.log("=== CHECKING USER 'teste@gmail.com' ===");
  const usersSnapshot = await db.collection("users").where("email", "==", "teste@gmail.com").get();
  if (usersSnapshot.empty) {
    console.log("❌ No user found with email 'teste@gmail.com' in 'users' collection.");
  } else {
    usersSnapshot.forEach(doc => {
      console.log(`Found user: ID=${doc.id}, Data:`, doc.data());
    });
  }

  console.log("\n=== CHECKING RECENT TOKENS IN 'tokens_pagos' ===");
  const tokensSnapshot = await db.collection("tokens_pagos").orderBy("createdAt", "desc").limit(10).get();
  if (tokensSnapshot.empty) {
    console.log("❌ No tokens found in 'tokens_pagos'.");
  } else {
    tokensSnapshot.forEach(doc => {
      console.log(`Token: ID=${doc.id}, Data:`, doc.data());
    });
  }

  console.log("\n=== CHECKING ALL USERS (last 5 created/updated) ===");
  const allUsersSnap = await db.collection("users").limit(10).get();
  allUsersSnap.forEach(doc => {
    console.log(`User: ID=${doc.id}, email=${doc.data().email}, assinante=${doc.data().assinante}, dataVencimento=${doc.data().dataVencimento}`);
  });
}

run().catch(console.error);
