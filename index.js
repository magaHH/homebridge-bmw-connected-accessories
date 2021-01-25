"use strict";

var request = require("request");
var requestretry = require('requestretry');
var Service, Characteristic, HomebridgeAPI;


module.exports = function(homebridge) {

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  HomebridgeAPI = homebridge;
  homebridge.registerAccessory("homebridge-bmw-connected-accessories", "BMW-Connected-Accessories", BMWConnectedAccessory);
}

function BMWConnectedAccessory(log, config) {
  this.log = log;
  this.name = config.name;

  this.type = config.type // "climate" || "horn" || "lights"
  this.vin = config.vin // "vin": "WBAJN51060xxxxxxx",
  this.username = config.username //   "username": "a@b.com",
  this.password = config.password //   "password": "password",
  this.client_id = config.client_id //   "client_id": "dbf0a542-xxxx-xxxx-xxxx-55172fbfce35"

  this.refreshToken = "";
	this.refreshtime = 0;
	this.authToken = "";
	this.lastUpdate = 0;

  this.currentState = false;


  //this.stateful = config.stateful;
  //this.reverse = config.reverse;
  // this.time = config.time ? config.time : 1000;
  this.time = 1000;
  this._service = new Service.Switch(this.name);

  this._service.getCharacteristic(Characteristic.On)
    .on('set', this._setOn.bind(this));


}

BMWConnectedAccessory.prototype.getServices = function() {
  return [this._service];
}


BMWConnectedAccessory.prototype.getExecution = function(callback) {
  this.log("Waiting for confirmation...");
  this.getauth(function(err){
    if (err) {
      callback(err,this.currentState);
    }

  var complete = 0;

  requestretry.get({
    url: 'https://www.bmw-connecteddrive.co.uk/remoteservices/rsapi/v1/' + this.vin + '/state/execution',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_1_1 like Mac OS X) AppleWebKit/604.3.5 (KHTML, like Gecko) Version/11.0 Mobile/15B150 Safari/604.1',
      'Authorization': 'Bearer ' + this.authToken,
      'accept':	'application/json, text/plain, */*',
    },
    // The below parameters are specific to request-retry
    maxAttempts: 5,   // (default) try 10 times
    retryDelay: 5000,  // (default) wait for 5s before trying again
    retryStrategy: myRetryStrategy

  }, function(err, response, body) {

    // this callback will only be called when the request succeeded or after maxAttempts or on error

    this.log('Error: ', err);
    this.log('Response: ', response);
    this.log('statusCode: ', response.statusCode);

    if (!err && response.statusCode == 200) {
      this.log('Success!');

      callback(null); // success
    }
    else {
      callback( new Error(response.statusCode),this.currentState);
      this.log(' ERROR REQUEST RESULTS:', err, response.statusCode, body);
    }
  }.bind(this));
}.bind(this));
}

function myRetryStrategy(err, response, body){
  // retry the request if we had an error or if the response was a 'Bad Gateway'
  var json = "";
  var json = JSON.parse(body);
  console.log('This is the Retry-json: ', json);

  // var commandtype = (json["remoteServiceType"]);
  var execution = "";
  var execution = (json["event"]["rsEventStatus"]);

  return err || execution === "PENDING" || execution === "RUNNING"
}

BMWConnectedAccessory.prototype._setOn = function(on, callback) {


  var bmwState = "";

  var jsonRequest = ''
  // unlock door_lock   RDU
  // lock door          RDL
  // start climate      RCN
 // horn                RHB
 // flash lights        RLF

 if (this.type == "climate") {
   bmwState = "RCN";
   jsonRequest = '{"rcnAction":"START"}'

 } else if (this.type == "horn") {
   bmwState = "RHB";
   jsonRequest = '{"number":2, "pause":1,"duration":1}'

 } else if (this.type == "lights") {
   bmwState = "RLF";
   jsonRequest = '{"number":2, "pause":1,"duration":1}'
 }

 else {
   //callback( new Error('ERROR Type not correct, Please check config'));
   console.log(' ERROR Type not correct, Please check config ');
 }


  this.log("Sending Command %s", bmwState);
  this.getauth(function(err){
    if (err) {
      this.log('Failed to Autehticate');
      callback(err);
    }

    console.log('current authtoken', this.authToken)

    var setStateUrl = 'https://www.bmw-connecteddrive.co.uk/remoteservices/rsapi/v1/' + this.vin + '/' + bmwState;
    console.log('StateURL', setStateUrl);

  request.post({
      url: setStateUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_1_1 like Mac OS X) AppleWebKit/604.3.5 (KHTML, like Gecko) Version/11.0 Mobile/15B150 Safari/604.1',
        'Authorization': 'Bearer ' + this.authToken,
    },
    json:  JSON.parse(jsonRequest)



  }, function(err, response, body) {

    if (!err && response.statusCode == 200) {
      this.log('Remote: ' + bmwState);

      // call this.getExecution
      this.getExecution(function(err){
        if (err) {
          callback(err,this.currentState);
        }

      setTimeout(function() {
          this._service.setCharacteristic(Characteristic.On, true);
        }.bind(this), this.time);

      callback(null); // success
    }.bind(this));
    }
    else {
      callback( new Error(response.statusCode));
      console.log(' ERROR REQUEST RESULTS:', err, response.statusCode, body);
    }
  }.bind(this));
}.bind(this));

}








BMWConnectedAccessory.prototype.getauth = function(callback) {
	if (this.needsAuthRefresh() === true) {
		this.log ('Getting Auth Token');
			request.post({
				url: 'https://customer.bmwgroup.com/gcdm/oauth/authenticate',
				headers: {
				'Host':	'customer.bmwgroup.com',
				'Origin':	'https://customer.bmwgroup.com',
				'Accept-Encoding':	'br, gzip, deflate',
				'Content-Type' : 'application/x-www-form-urlencoded',
    		'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_1_1 like Mac OS X) AppleWebKit/604.3.5 (KHTML, like Gecko) Version/11.0 Mobile/15B150 Safari/604.1',
				'Origin': 'https://customer.bmwgroup.com',
				//'Authorization': 'Basic ' + this.authbasic,
  			},
				form: {
					'username': this.username,
					'password': this.password,
					'client_id':this.client_id,
					'response_type': 'token',
					'redirect_uri':	'https://www.bmw-connecteddrive.com/app/default/static/external-dispatch.html',
					'scope': 'authenticate_user fupo',
					'state': 'eyJtYXJrZXQiOiJnYiIsImxhbmd1YWdlIjoiZW4iLCJkZXN0aW5hdGlvbiI6ImxhbmRpbmdQYWdlIiwicGFyYW1ldGVycyI6Int9In0',
					'locale': 'GB-en'
				}
			},function(err, response, body) {
				 if (!err && response.statusCode == 302) {
					 //this.log('Auth Success!');
					 var d = new Date();
				   var n = d.getTime();
					 var location = response.headers['location'];
					 //this.log(location);
					 var myURL = require('url').parse(location).hash;
					 this.log(myURL);
					 var arr = myURL.split("&");
					 this.authToken = arr[1].substr(arr[1].indexOf("=")+1);
					 this.refreshtime = n + arr[3].substr(arr[3].indexOf("=")+1) * 1000;
					 this.log ('Got Auth Token: ' + this.authToken);
					 this.log('Refreshtime: ' + this.refreshtime);
					 callback(null);
				 }
				 else{
				this.log('Error getting Auth Token');
				 callback(response.statusCode);
			 			}
				}.bind(this)
		);
	}
	else{
		callback(null);
	}
}

BMWConnectedAccessory.prototype.needsAuthRefresh = function () {
	var currentDate = new Date();
  	var now = currentDate.getTime();
 	this.log("Now   :" + now);
 	this.log("Later :" + this.refreshtime);
	if (now > this.refreshtime) {
		return true;
	}
	return false;
}
