var Promise = require("bluebird"),
    request = require("request");

const BASE_URL ='https://order.chipotle.com';

function Chipotle(options) {
  if (!options) {
    throw new Error('options object was empty.');
  }
  this._username = options.username;
  this._password = options.password;
  this._locationId = options.locationId;
  this._phoneNumber = options.phoneNumber;
  this._currentOrderId = undefined;
  this._cookie='';
  this._cookieStore = request.jar();
  this.request = Promise.promisifyAll(request.defaults({jar: this._cookieStore, followRedirect: false, multiArgs: true}));
};

/*
  Logs the user in using the configured credentials.
*/
Chipotle.prototype.login = function() {
  var self = this;
  var authPayload = {"username":self._username,"password":self._password,"persist":false};
  return self.request.postAsync({
    uri: BASE_URL + '/api/customer/login',
    json:true,
    body: authPayload,
  })
  .then(bodyOrError)
  .then(function(response){
      console.log('login success!');
      // save the CustomerToken to be used in future requests
      this._cookie = 'st='+response.CustomerToken;
      return;
  });
};

/*
  Adds an order
*/
Chipotle.prototype.addOrder = function(order) {
  var self = this;
  console.log("attempting to add order");
  var orderPayload = order;
  return self.request.postAsync({
    uri: BASE_URL+ '/api/order/0/meal/'+ self._locationId,
    json:true,
    body: orderPayload
  })
  .then(bodyOrError)
  .then(function(response){
    self._currentOrderId = response.OrderId;
  });
};

/*
  Gets the users current order
*/
Chipotle.prototype.getCurrentOrder = function() {
  var self = this;
  if(self._currentOrderId === undefined){
    throw new Error("Current Customer Order Id is not defined");
  }
  return self.request.getAsync({
    uri: BASE_URL+'/api/order/'+self._currentOrderId+'/bag/'+self._locationId,
    json:true,
  })
  .then(bodyOrError)
  .then(function(response){
    return response.Meals;
  });
};

Chipotle.prototype.getPossibleOrderTimes = function(){
  var self = this;
  // makes a blank order to the location to then get order times
  var order = {};
  return self.addOrder(order)
  .then(function(){
    return self.request.getAsync({
      uri: BASE_URL+'/api/restaurant/'+self._locationId+'/pickuptimes/'+self._currentOrderId,
      json:true,
    })
    .then(bodyOrError)
    .then(function(response){
      return response;
    });
  });
}

/*
  Gets the menu for a specified location w/ prices
*/
Chipotle.prototype.getMenu = function(){
  var self = this;
  return self.request.getAsync({
    uri: BASE_URL+ '/api/restaurant/'+self._locationId+'/menu',
    json:true
  })
  .then(bodyOrError)
  .then(function(response){
    return response;
  });
}

/*
  Gets the users saved credit cards and returns the token of the first saved card,
  token can then be used in the submit order request
*/
Chipotle.prototype.getSavedCreditCards = function(){
  var self = this;
  return self.request.getAsync({
    uri: BASE_URL+'/api/customer/creditcard',
    json:true,
    headers: {'Cookie': self._cookie}
  })
  .then(bodyOrError)
  .then(function(response){
    return response.WalletTokens[0]; // gets the info for the first credit card
  });
}

/*
  Set the order pickup time of the current order. This must be done before order can be submitted
*/
Chipotle.prototype.setOrderPickupTime = function(time){
  var self = this;
  var timePayload = time;
  return self.request.postAsync({
    uri: BASE_URL+ '/api/order/'+self._currentOrderId+'/pickuptime',
    json:true,
    body: timePayload,
    headers:{'Cookie':self._cookie}
  })
  .then(bodyOrError)
  .then(function(response){
    return;
  });
}

/*
  Submits the current order
*/
Chipotle.prototype.submitCurrentOrder = function(){
  var self = this;
  var paymentInfo = {"paymentType":"credit","cardId":null, "storeId":self._locationId};
  return self.getSavedCreditCards().then(function(cardDetails){
    paymentInfo["paymentCard"]=cardDetails;
	  paymentInfo["cardId"]= cardDetails["tokenId"] || null;
    console.log(JSON.stringify(paymentInfo, null, 4));
    self.request.postAsync({
      uri: BASE_URL + '/api/order/'+self._currentOrderId+'/submit',
      json: true,
      body: paymentInfo
    })
    .then(bodyOrError)
    .then(function(response){
      return;
    });
  })
}
/*
  Simple helper to status check the response and throw an error if it was not a 200.
  If there was no error, returns the response body.
*/
function bodyOrError(response) {
  if(response.statusCode == 200) {
    return response.body;
  } else {
    throw new Error('Request Failed: '+ response.statusCode +
          ' Message: ' + response.body.Message +
          ' Error Type: ' + response.body.Type);
  }
};
module.exports = Chipotle;
