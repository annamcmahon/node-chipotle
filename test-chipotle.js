var Chipotle = require('./node-chipotle.js');

var chipotle = new Chipotle({
    "username":"***",
    "password":"***",
    "persist":false, 
    locationId: '***', 
    phoneNumber:'***'});

var order ={
    "entree":{"type":"Burrito"},
    "fillings":[{"Type":"Chicken"}],
    "rice":[{"Type":"RiceWhite"}],
    "beans":[{"Type":"BeansBlack"}],
    "toppings":[{"Type":"GuacTopping"}],
    "sides":[{"Type":"Chips"}],
    "drinks":[],
    "mealName":"Meal 5"};

chipotle.login().then(function() {
  console.log("logged in! ");
  chipotle.getSavedCreditCards().then(function(body){
    console.log("got cards");
  });
  chipotle.getMenu().then(function(){
    console.log("got the menu");
  });
  chipotle.addOrder(order).then(function(){
      console.log("order added");
      chipotle.getCurrentOrder().then(function(){
        console.log("got the current order");
      });
  });
});
