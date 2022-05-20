const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const res = require('express/lib/response');

app.use(cors());
app.use(express.json());
require('dotenv').config();


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eq9rh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("care-aid").collection("services");
    const bookingCollection = client.db("care-aid").collection("bookings");

    app.get('/services', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    })

    app.post('/bookings', async (req, res) =>{
      const booking = req.body;
      const query = {treatmentId: booking.treatmentId, date: booking.date, patientEmail: booking.patientEmail};
      const exists = await bookingCollection.findOne(query);
      console.log(exists)
      if(exists){
        return res.send({success: false, booking: exists})
      }else{
        const result = await bookingCollection.insertOne(booking);
        return res.send({success: true, result})
      }

    })
    
    app.get('/available', async(req, res) =>{
      const date = req.query.date || 'May 20, 2022';
      const query = {date: date};
      const bookings = await bookingCollection.find(query).toArray();
      const services = await serviceCollection.find().toArray();

      services.forEach(service =>{
        const serviceBookings = bookings.filter(s => s.treatment === service.name);
        const booked = serviceBookings.map(s => s.slot);
        const available = service.slots.filter(s => !booked.includes(s))
        service.available = available;                                                                                                                                                                                                                                                                                            
      })
      res.send(services)
    })
    

  } finally { }

}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Care Aid Works Successfully')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})