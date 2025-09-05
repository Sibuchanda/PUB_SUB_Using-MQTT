import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import publishRoutes from './controler/publishController.js'

const app = express();
const PORT = 5000;

//middlewares
app.use(cors());
app.use(bodyParser.json());

app.use("/", publishRoutes);


app.listen(PORT, () => {
  console.log(`Listening to PORT : ${PORT}`);
});
