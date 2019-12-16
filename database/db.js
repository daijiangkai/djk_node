var mysql=require("mysql");
var db=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"123456",
    port:"3306",
    database:"firstant"
});
db.connect();
module.exports=db;