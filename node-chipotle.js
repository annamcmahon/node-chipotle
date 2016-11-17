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
  this._currentOrderId = 0;
  this._cookie='';
  this._cookieStore = request.jar();
  this.request = Promise.promisifyAll(request.defaults({jar: this._cookieStore, followRedirect: false}));
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
  .then(function(response){
    console.log(response.body);
    if(response.body.Status =="Success") {
      console.log('login success mwahaha!');
      this._cookie = 'st='+response.body.CustomerToken;
      console.log(response.body.CustomerToken);
      return;
    } else {
      throw new Error('login failed. check credentials.');
    }
  });
};

Chipotle.prototype.addOrder = function(order) {
  var self = this;
  console.log("attempting to add order");
  var orderPayload = order;
  return self.request.postAsync({
    uri: BASE_URL+ '/api/order/0/meal/'+ self._locationId,
    json:true,
    body: orderPayload
  })
  .then(function(response){
    console.log(response);
    self._currentOrderId = response.body.OrderId;
  });
};

Chipotle.prototype.getCurrentOrder = function(id) {
  var self = this;
  console.log("getting the current order: "+ BASE_URL+ '/api/order/'+ self._currentOrderId + '/bag/' + self._locationId);
  return self.request.getAsync({
    uri: BASE_URL+'/api/order/'+self._currentOrderId+'/bag/'+self._locationId,
    json:true,
  })
  .then(function(body){
    console.log("body of current order: ");
    console.log(body.body.Meals);
  });
};
Chipotle.prototype.getMenu = function(){
  var self = this;
  return self.request.getAsync({
    uri: BASE_URL+ '/api/restaurant/'+self._locationId+'/menu',
    json:true
  }).then(function(body){
    console.log("Menu: ");
    console.log(body);
  });
}
Chipotle.prototype.getSavedCreditCards = function(){
  var self = this;
  return self.request.getAsync({
    uri: BASE_URL+'/api/customer/creditcard',
    json:true,
    headers: {'Cookie': self._cookie}
  }).then(function(response){
    console.log("saved cards:");
    console.log(response.body.WalletTokens);
  });
}

Chipotle.prototype.submitCurrentOrder = function(paymentInfo){
  var self = this;
  return self.request.getAsync({
    uri: BASE_URL + '/api/order/'+self._currentOrderId+'/submit',
    json: true,
    body: paymentInfo
  }).then(function(body){
    if(response.body.Status =="Success") {
      console.log('order placed');
      return;
    } else {
      throw new Error('submit order request failed: '+ response.body.statusCode + ' body: ' + body);
    }
  })
}

function bodyOrError(response, body) {
  if(response.statusCode == 200) {
    return body;
  } else {
    throw new Error('request failed: '+ response.statusCode + ' body: ' + body);
  }
};

module.exports = Chipotle;
