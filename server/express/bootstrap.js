//libs
var $q       = require('./utils/q');
var odbc     = require('./utils/odbc');
var path     = require('path');
var filePath = function(relativePath){ return path.resolve(__dirname,relativePath); };

module.exports = $q.sequance([
    //check db.json file
    function(){
        return odbc
        .read(filePath('../db/db.json'))
        .catch(function(error){
            return odbc.createFrom(filePath('../db/db.json'), filePath('../db/default.json'));
        });
    },
    function(db){
        var express    = require('express');
        var bodyParser = require('body-parser');

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
            var result = db.all();
            res.status(200).send(result);
        });
        
        app.get("/:models/",function(req,res){
            var result = db.table(req.params.models).all();
            res.status(200).send(result);
        });

        app.get("/:model/:id",function(req,res){
            var result = db.table(req.params.model).id(req.params.id);
            if(result){
                res.status(200).send(result);
            } else {
                res.status(404).send(null);
            }
        });

        app.post("/:model",function(req,res){
            db.writeDataSource(function(){
                return db.table(req.params.model).insert(req.body);
            }).then(function(result){
                res.status(200).send(result);
            });
        });

        app.put("/:model/:id",function(req,res){
            res.status(200).send("ok");
        });

        app.patch("/:model/:id",function(req,res){
            res.status(200).send("ok");
    
        });

        app.delete("/:model/:id",function(req,res){
            db.writeDataSource(function(){
                return db.table(req.params.model).deleteBy(function(data){
                    return data.id == req.params.id;
                });
            }).then(function(result){
                res.status(200).send(result);
            });
        });
    }
]);