const express = require('express');

const bodyParser = require('body-parser');

const UserRouter = require('./webservice/Router/userRouter.js');

const AdminRouter = require('./adminapi/route/router.js');

const cors = require('cors');





const app = express();

app.use(cors());



app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const stripeRoutes = require('./webservice/stripe_payment/routes/stripeRoute.js');

const path = require('path');

app.set('views', path.join(__dirname, 'stripe_payment', 'view'));

app.set('view engine', 'ejs');

app.use('/butler_hospitality/server/webservice/stripe_payment', stripeRoutes);

app.use('/butler_hospitality/server/webservice', UserRouter);

app.use('/butler_hospitality/server/adminapi', AdminRouter);



app.listen(3002, () => {

    console.log('Server running at http://localhost:3002');

});







