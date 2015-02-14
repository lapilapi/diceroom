//============================================
// requires
//============================================
const ejs		  = require('ejs');
const express	  = require('express');
const config	  = require('./conf/config.json');
const basic_auth  = require('basic-auth-connect');
const dice		  = require('./lib/api.js');

//============================================
// express settings
//============================================
var app = express();
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/static'));

//============================================
// basic authentication
//============================================
app.use(basic_auth(config.basic.user, config.basic.pass));

//============================================
// router
//============================================
app.get('/', function(req, res) {
	res.render('index', {title: "sample"});
});

app.get('/lot_list', function(req, res) {
	dice.api.lot_list(req, function(json, code) {
		res.send(json, {'Content-Type':'application/json'}, code);
	}, config);
});

app.get('/reference', function(req, res) {
});

app.get('/lot', function(req, res) {
	dice.api.lot(req, function(json, code) {
		res.send(json, {'Content-Type':'application/json'}, code);
	}, config);
});

//============================================
// execute
//============================================
app.listen(3000);
console.log("server listening on port 3000");
