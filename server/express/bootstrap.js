//libs
var $q       = require('./utils/q');
var odbc     = require('./utils/odbc');
var listener = require('./utils/listener')();
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
        var ENV= {
            PORT:8880
        };
        
        var express    = require('express');
        var bodyParser = require('body-parser');

        //express init
        var app  = express();
        var http = require('http').Server(app);

        //express server config 
        //app.set('port',8880);  //http://localhost:7890
        //app.listen(app.get('port'), function () {
        //    console.log('Express server listening on port ' + app.get('port'));
        //});
        
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({
            extended: true
        }));
        
        http.listen(ENV.PORT,function(){
            console.log('Express server listening on port ' + ENV.PORT);
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

        app.get("/presudo-api-server/all",function(req,res){
            var result = db.all();
            res.status(200).send(result);
        });
        
        app.get("/presudo-api-server/:model/keys",function(req,res){
            var result = Object.keys(Object.assign.apply(Object,db.table(req.params.model).all()));
            res.status(200).send(result);
        });
        
        app.post("/presudo-api-server/:model/create",function(req,res){
            db.writeDataSource(function(){
                return db.createTable(req.params.model);
            }).then(function(result){
                listener.emit("presudo:db:event",{type:"create",table:req.params.model,value:result});
                res.status(200).send(result);
            });
        });
        
        app.post("/presudo-api-server/:model/drop",function(req,res){
            db.writeDataSource(function(){
                return db.dropTable(req.params.model);
            }).then(function(result){
                listener.emit("presudo:db:event",{type:"drop",table:req.params.model,value:result});
                res.status(200).send(result);
            });
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
                listener.emit("presudo:db:event",{type:"insert",table:req.params.model,id:~~req.params.id,value:result});
                res.status(200).send(result);
            });
        });

        app.put("/:model/:id",function(req,res){
            db.writeDataSource(function(){
                var value    = [];
                var oldValue = [];
                
                db.table(req.params.model).updateBy(function(search){ 
                    return search.id == req.params.id;
                },function(datum){
                    oldValue.push(Object(datum));
                    
                    Object.keys(datum).forEach(function(key){
                        delete datum[key];
                    });
                    
                    var updateDatum = Object.assign({},req.body);
                    
                    if(!updateDatum.id){
                        updateDatum.id = ~~req.params.id;
                    }
                    
                    Object.assign(datum, updateDatum);
                    
                    value.push(datum);
                });
                
                return {
                    value:value,
                    oldValue:oldValue
                };
            }).then(function(result){
                listener.emit("presudo:db:event",{type:"update",table:req.params.model,id:~~req.params.id,value:result.value,oldValue:result.oldValue});
                res.status(200).send(result);
            });
        });

        app.patch("/:model/:id",function(req,res){
            db.writeDataSource(function(){
                var value    = [];
                var oldValue = [];
                
                db.table(req.params.model).updateBy(function(search){ 
                    return search.id == req.params.id;
                },function(datum){
                    oldValue.push(Object(datum));
                    
                    Object.assign(datum,req.body);
                    
                    if(!datum.id){
                        datum.id = ~~req.params.id;
                    }
                    
                    value.push(datum);
                });
                
                return {
                    value:value,
                    oldValue:oldValue
                };
                
            }).then(function(result){
                listener.emit("presudo:db:event",{type:"update",table:req.params.model,id:~~req.params.id,value:result.value,oldValue:result.oldValue});
                res.status(200).send(result);
            });
        });

        app.delete("/:model/:id",function(req,res){
            db.writeDataSource(function(){
                var deleted = db.table(req.params.model).deleteBy(function(data){
                    return data.id == req.params.id;
                });
                return deleted[0];
            }).then(function(result){
                listener.emit("presudo:db:event",{type:"delete",table:req.params.model,id:~~req.params.id,value:result});
                res.status(200).send(result);
            });
        });
        
        
        var io = require('socket.io')(http);
        
        io.of("/presudo:db").on("connection", function(socket){
            
            
            var off = listener.on("presudo:db:event",function(data){
                socket.emit("event",data);
                //socket.broadcast.emit("event",data)
            });
            
            
            console.log('db monitoring of admin connected');
            socket.on('disconnect', function(){
                off();
                console.log('db monitoring of admin disconnected');
            });
            //socket.leave();
        });
    }
]);