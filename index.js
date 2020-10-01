const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;

// console.log(process.env.DB_PASS)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zxfa1.mongodb.net/burjALArab?retryWrites=true&w=majority`;

const port = 9000;
const app = express();
app.use(cors());
app.use(bodyParser.json());


const serviceAccount = require("./configs/burj-al-arab-46402-firebase-adminsdk-3i2ga-1994164f7d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DB_DATA
});


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true  });
client.connect(err => {
  const bookings = client.db("burjALArab").collection("bookings");
    
  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
    .then(result => {
      res.send(result.insertedCount > 0);
    })
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
        const idToken = bearer.split(' ')[1];
        admin.auth().verifyIdToken(idToken)
        .then(function(decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if(tokenEmail == queryEmail){
            bookings.find({email: queryEmail})
              .toArray((err, documents) => {
                  res.status(200).send(documents);
            })
          }
          else{
            res.status(401).send(' unauthorized access')
          }
        })
        .catch(function(error) {
          res.status(401).send(' unauthorized access')
        });
    }
    else{
      res.status(401).send(' unauthorized access')
    }

  })
});


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port)
