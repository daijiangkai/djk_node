var express = require('express');
var router = express.Router();
var db=require('../database/db');

/* GET home page. */
router.get('/', function(req, res, next) {
    var data={};
    if(req.session.user) {
        data.user = req.session.user;
    }

    var sql="select * from music where istop=1";
    db.query(sql,(err,result)=>{
        if(!err){
            data.music=result;
        }
    })


    var max=5;
    var sql="select count(*) as roto from pili where istop=1"
    db.query(sql,(err,result)=>{

        data.max_page=Math.ceil(result[0].roto/max);

        data.page=!req.query.page||parseInt(req.query.page)<1?1:parseInt(req.query.page);
        data.page=data.page>data.max_page?data.max_page:data.page;
        var sql="select * from pili where istop=1 limit "+(data.page-1)*max+","+max;
        db.query(sql,(err,result)=>{
            if(!err) {
                data.pili = result;
                var sql="select * from study limit 10";
                db.query(sql, (err,result)=>{
                    if(!err){
                        data.study=result;
                        res.render('index',{data:data});
                    }
                })
        }
        })
    })

});
module.exports = router;
