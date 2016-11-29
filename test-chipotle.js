var Chipotle = require('./node-chipotle.js');
var config = require('./config.json');

var chipotle = new Chipotle({
    "username": config["username"],
    "password": config["password"],
    "persist": config["persist"],
    "locationId": config["locationId"],
    "phoneNumber": config["phoneNumber"]
  });
var order ={"entree":{"type":"SidesDrinks"},"sides":[{"Type":"Chips","Name":"Chips","SummaryName":"Chips","Price":1.35,"selected":true,"state":"number","quantity":1}],"drinks":[],"mealName":"Meal 1"};
var time = {
  "SlotEndTime":"2016-11-28T10:00:00",
  "SlotStartTime":"2016-11-28T9:45:00"
};

chipotle.login().then(function() {
  console.log("logged in! ");
  chipotle.getSavedCreditCards().then(function(body){
    console.log("got cards: ");
    console.log(body);
    chipotle.addOrder(order).then(function(){
      console.log("order added");
      chipotle.setOrderPickupTime(time).then(function(){
        console.log("set the order pickup time");
        chipotle.submitCurrentOrder().then(function(){
         console.log("submitted the current order");
        });
      });
    });
  });
});
