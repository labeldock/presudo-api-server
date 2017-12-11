var q       = require('./utils/q');
var path    = require('path');
var getPath = function(path){ return path.resolve(__dirname,path); };



q.sequance([
    //check dbdata.json
    function(){
        var readFile   = Promise.promisify(fs.readFile);
        var writeFile  = Promise.promisify(fs.wrtieFile);
        
        var fs = require('fs');
        
        if(!fs.existsSync(getPath('../db/dbdata.json'))){
            
            fs.readFile('../db/default.json', 'utf8', function (err,data) {
              if (err) {
                return console.log(err);
              }
              console.log(data);
            });
            
            fs.writeFile("/tmp/test", "Hey there!", function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log("The file was saved!");
            }); 
        } else {
        
        }
    }
]);

var express    = require('express');
var bodyParser = require('body-parser');

var _          = require('lodash');

//express init
var app = express();

//express server config 
app.set('port',8880);  //http://localhost:7890
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
  
//static resources
app.use("/",function(req,res,next){
    if(req.url === "/" || req.url === "/index.html"){
        res.sendFile(path.join(path.resolve(__dirname,'../index.html')));
    } else {
        next();
    }
});

app.use("/",express.static(path.resolve(__dirname,'../static')));

app.get("/presudo-api-server",function(req,res){
    res.status(200).send({foo:"bar"})
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
