//libs
var $q       = require('./utils/q');
var fs       = require('fs');
var path     = require('path');
var filePath = function(relativePath){ return path.resolve(__dirname,relativePath); };

//app
var STATE = {
    run:false,
    DB:null
};

module.exports = $q.sequance([
    //check db.json
    function(){
        var readFile   = $q.promisify(fs.readFile);
        var writeFile  = $q.promisify(fs.writeFile);
        
        if(!fs.existsSync(filePath('../db/db.json'))){
            return readFile(filePath('../db/default.json'), 'utf8').then(function(data){
                return writeFile(filePath("../db/db.json"), data).then(function(){
                    STATE.DB = data;
                    console.log("CREATED db.json");
                }); 
            });
        } else {
            return readFile(filePath('../db/db.json'), 'utf8').then(function(raw){
                try {
                    STATE.DB = JSON.parse(raw);
                } catch(e) {
                    $q.reject(new Error("db.json is borken"));
                }
            });
        }
    },
    function(){
        console.log("DB",STATE.DB);
    },
    function(){
        console.log("SERVER BOOT");
        
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
    }
]);