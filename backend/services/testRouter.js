require('dotenv').config();
const { routeQuestion } = require('./askPlusRouter');

async function test() {
    console.log(await routeQuestion("Give me DBMS Notes"));
    console.log(await routeQuestion("Did Amazon visit SIT?"));
    console.log(await routeQuestion("What is the attendance condonation policy?"));
    console.log(await routeQuestion("I need 50 marks in CIE, how much in SEE?"));
}

test();
