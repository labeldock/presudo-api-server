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
        table:function(tableName){
            return new ODBCObjectTable(this, tableName);
        }
    };
    
    var ODBCObjectTable = function(driver, tableName){
        this.driver  = driver;
        this.name    = tableName;
        this.$target = this.driver.dataSource[this.name] || [];
    };
    
    ODBCObjectTable.prototype = {
        all:function(){
            return _.cloneDeep(this.$target);
        },
        create:function(datum){
            if(typeof datum === "object"){
                var maxId = _.get(_.maxBy(this.$target,"id"),"id");
            
                if(typeof maxId === "number"){
                    maxId++;
                } else {
                    maxId = 1;
                }
                
                datum.id = maxId;
                this.$target.push(datum);
            }
        },
        where:function(query){
            return _.cloneDeep(_.find(this.$target,query))
        },
        id:function(id){
            return _.findLast(this.$target,{id:id});
        },
        update:function(datum,id){
            var lastDatum = _.findLast(this.$target, {id:_.get(datum,"id") || id})
            _.assign(lastDatum,datum);
            return _.cloneDeep(lastDatum);
        }
    };
    
    var ODBCDataRow = function(driver, tableName){
        
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