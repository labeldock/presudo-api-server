//object database connection
var _  = require('lodash');
var $q = require('./q');

var fs         = require('fs');
var readFile   = $q.promisify(fs.readFile);
var writeFile  = $q.promisify(fs.writeFile);

var ODBCObjectConnection = (function(){
    var ODBCObjectConnector = function(object){
        this.dataSource = object;
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
                var maxId = _.get(_.maxBy(dataSoruce,"id"),"id");
        
                if(typeof maxId === "number"){
                    maxId++;
                } else {
                    maxId = 1;
                }
            
                datum.id = maxId;
                dataSoruce.push(datum);
                
                return datum;
            }) : null;
        },
        update:function(datum,id){
            var lastDatum = _.findLast(this.$target, {id:_.get(datum,"id") || id})
            _.assign(lastDatum,datum);
            return _.cloneDeep(lastDatum);
        }
    };
    
    return function(object){
        return new ODBCObjectConnector(object);
    }
}());

var ODBC = {
    open:function(raw){
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

        return ODBCObjectConnection(object);
    },
    read:function(path){
        return readFile(path, 'utf8').then(function(raw){
            return ODBC.open(raw);
        });
    },
    create:function(path, data){
        switch(typeof data){
            case "object":
            case "undefined":
                data = (data || {});
                return writeFile(path, data).then(function(){
                    return ODBC.open(data);
                });
                break;
            case "string":
                return readFile(data, 'utf8').then(function(data){
                    return writeFile(path, data).then(function(){
                        return ODBC.open(data)
                    });
                });
                break;
            default:
                return $q.reject(new Error("Unknown db create data type"));
                break;
        }
    }
};

module.exports = ODBC;