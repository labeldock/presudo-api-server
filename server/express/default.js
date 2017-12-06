var express    = require('express');
var bodyParser = require('body-parser');
var path       = require('path');
var _          = require('lodash');

//express init
var app = express();

//express server config 
app.set('port',8880);  //http://localhost:7890
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
  
//static resources
app.use("/public",express.static(path.resolve(__dirname,'../public')));  

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

app.get("/:models/",function(req,res){
    res.status(200).send("ok");
});

app.get("/:model/:index",function(req,res){
    res.status(200).send("ok");
});

app.post("/:model",function(req,res){
    res.status(200).send("ok");
});

app.put("/:model/:index",function(req,res){
    res.status(200).send("ok");
    
});

app.patch("/:model/:index",function(req,res){
    res.status(200).send("ok");
    
});

app.delete("/:model/:index",function(req,res){
    res.status(200).send("ok");
});

  
module.exports = app;
