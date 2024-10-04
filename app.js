const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const cors = require('cors');

app.use(cors({
    origin: '*',  // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Allow all HTTP methods
    allowedHeaders: '*',  // Allow all headers
  }));

const url = 'mongodb://localhost:27017';
const dbName = 'exel-db';  
const client = new MongoClient(url);

async function getLatestVersion(arr) {
  return Object.values(
    arr.reduce((acc, curr) => {
      acc[curr.EquipmentNumber] = curr; // Override with the last occurrence of each id
      return acc;
    }, {})
  );
}

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

async function fetchDataFromMongo(collectionName, equipmentNo) {
  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const searchList = equipmentNo.EquipmentNumber
    var findList=[]
    if(typeof searchList !== 'object'){
        findList=[parseInt(searchList), searchList]
    }
    else{
        findList = [...searchList.map(x=>parseInt(x)), ...searchList.map(x=>x.toString())]
      }
      const response = await collection.find({EquipmentNumber : { $in: findList }}).toArray()
    return getLatestVersion(response); 
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function fetchEqNoFromSapCollection(collectionName, Materialnummer) {
  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    var findList=[]
    if(typeof searchList !== 'object'){
        findList=[parseInt(Materialnummer.MaterialNumber), Materialnummer.MaterialNumber]
    }
    const response= await collection.find({Materialnummer : { $in: findList }}).toArray()
    return getLatestVersion(response); 
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

app.get('/api/kommissionen', async (req, res) => {
  try {
    const data = await fetchDataFromMongo('kommissionen', req.query); 
    res.json(data); 
  } catch (error) {
    res.status(500).send("Error fetching data");
  }
});

app.get('/api/sap', async (req, res) => {
    try {
      const data = await fetchDataFromMongo('sap-exel', req.query); 
      res.json(data); 
    } catch (error) {
      res.status(500).send("Error fetching data");
    }
  });

  app.get('/api/sap-material', async (req, res) => {
    try {
      const data = await fetchEqNoFromSapCollection('sap-exel', req.query);
      console.log(data.map(x=>x.EquipmentNumber))
      const result = await fetchDataFromMongo('kommissionen', {EquipmentNumber : data.map(x=>x.EquipmentNumber)}); 
      res.json(result); 
    } catch (error) {
      res.status(500).send("Error fetching data");
    }
  });

  app.get('/api/multi-eq', async (req, res) => {
    try {
      const data = await fetchDataFromMongo('kommissionen', req.query); 
      res.json(data); 
    } catch (error) {
      res.status(500).send("Error fetching data");
    }
  });

const port = 3000;
app.listen(port, async () => {
  await connectToMongoDB(); 
  console.log(`Server is running on http://localhost:${port}`);
});