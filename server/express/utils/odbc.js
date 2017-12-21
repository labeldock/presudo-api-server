//object database connection
var _  = require('lodash');
var $q = require('./q');

var fs         = require('fs');
var readFile   = $q.promisify(fs.readFile);
var writeFile  = $q.promisify(fs.writeFile);

var ODBCObjectConnection = (function(){
    var ODBCObjectConnector = function(object, writeFn){
        this.dataSource      = object;
        this.writeDataSource = function(beforeFn){
            var result;
            
            if(typeof beforeFn === "function"){
                result = beforeFn();
            }
            
            return writeFn(this.dataSource).then(function(resp){
                console.log(`[${Date.now()}] Success write ODBC dataSource`);
                return result;
            });
        }.bind(this);
    };
    
    ODBCObjectConnector.prototype = {
        all:function(){
            return _.cloneDeep(this.dataSource);
        },
        table:function(tableName){
            return new ODBCObjectTable(this, tableName);
        }
    };
    
    var ODBCObjectTable = function(driver, tableName){
        this.tableName    = tableName;
        this.handleSource = function(handle){
            return handle(driver.dataSource[this.tableName]);
        };
        this.dataSoruce = function(where){
            var dataSource = driver.dataSource[this.tableName] || [];
            return _.cloneDeep(where? _.filter(dataSource,where) : dataSource);
        };
    };
    
    ODBCObjectTable.prototype = {
        all:function(){
            return this.dataSoruce();
        },
        where:function(query){
            return this.dataSoruce(query);
        },
        id:function(id){
            return this.dataSoruce({id:~~id})[0];
        },
        insert:function(datum){
            return typeof datum === "object" ? this.handleSource(function(dataSource){
                var maxId = _.get(_.maxBy(dataSource,"id"),"id");
        
                if(typeof maxId === "number"){
                    maxId++;
                } else {
                    maxId = 1;
                }
            
                datum.id = maxId;
                dataSource.push(datum);
                
                return datum;
            }) : null;
        },
        deleteBy:function(yieldFn){
            this.handleSource(function(dataSource){
                var saveData = _.filter(dataSource, function(d,i){ return !yieldFn(d,i); });
                Array.prototype.splice.apply(dataSource,[0,dataSource.length].concat(saveData));
            });
        },
        updateBy:function(filterFn,yieldFn){
            this.handleSource(function(dataSource){
                _.filter(dataSource, filterFn).forEach(function(datum){
                    yieldFn(datum);
                });
            });
        }
    };
    
    return function(object,writeFn){
        return new ODBCObjectConnector(object,writeFn);
    }
}());

var ODBC = (function(){
    var ODBCWriterFactory = function(path){
        return function(data){
            return writeFile(path, JSON.stringify(data))
            .then(function(){ return data; });
        }
    }
    
    return {
        open:function(raw,option){
            var object;
        
            if(typeof raw === "object"){
                object = raw;
            } else {
                try {
                    object = JSON.parse(raw);
                } catch(e) {
                    $q.reject(new Error("odbc data source is borken"));
                }
            }

            return ODBCObjectConnection(object,option);
        },
        read:function(path){
            return readFile(path, 'utf8').then(function(raw){
                return ODBC.open(raw,ODBCWriterFactory(path));
            });
        },
        createFrom:function(path, data){
            switch(typeof data){
            case "object":
            case "undefined":
                data = (data || {});
                return writeFile(path, data).then(function(){
                    return ODBC.open(data,ODBCWriterFactory(path));
                });
                break;
            case "string":
                return readFile(data, 'utf8').then(function(data){
                    return writeFile(path, data).then(function(){
                        return ODBC.open(data,ODBCWriterFactory(path))
                    });
                });
                break;
            default:
                return $q.reject(new Error("Unknown db create data type"));
                break;
            }
        }
    };
}());



module.exports = ODBC;