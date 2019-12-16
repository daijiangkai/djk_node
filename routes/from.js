var express = require('express');
var router = express.Router();
var db=require('../database/db');
var multer = require("multer");
var path = require("path");
var fs = require("fs");
var moment = require('moment');

var upload = multer({ dest: './public/uploads/' });

// 第一个页面
router.get('/one', function(req, res, next) {

    var data={};
    if(req.session.user) {
        data.user = req.session.user;
    }
    var sql="select * from pili";
    db.query(sql,function (err,result) {
            if(!err){
                data.pili=result;

                res.render("one",{data:data})
            }
    })

});

// 第二个页面
router.get('/two/:id', function(req, res, next) {
    var data={};
    if(req.session.user) {
        data.user = req.session.user;
    }
    data.id=parseInt(req.params.id);

    db.query("select * from classify",(err,result)=>{
        if(!err){
            data.classify=result;

        }
    })
    db.query("select * from study",(err,result)=>{
        if(!err){
            data.study1=result;
        }
    })
    db.query("select * from study order by view desc limit 10 ",function (err,result) {
        if(!err){
            data.study_xu=result;
        }
    })
    if(data.id==0){
        var sql="select * from study order by id desc";
    }else {
        var sql = "select * from study  where classify_id=" + data.id+" order by id desc";
    };
    db.query(sql,(err,result)=>{
        if(!err){
            data.study=result;
            res.render("two",{data:data});
        }
    })
});

// 搜索框
router.get('/sou', function(req, res, next) {
    var data={};
    if(req.session.user) {
        data.user = req.session.user;
    }
    db.query("select * from study",(err,result)=>{
        if(!err){
            data.study1=result;
        }
    })
    db.query("select * from study order by view desc limit 10 ",function (err,result) {
        if(!err){
            data.study_xu=result;
        }
    })
    db.query("select * from classify",(err,result)=>{
        if(!err){
            data.classify=result;

        }
    })
    var keyword=req.query.keyword;
    var sql="select * from study where title like '%"+keyword+"%' or content like '%"+keyword+"%'";
    db.query(sql,(err,result)=>{
        if(!err){
            data.study=result;
            res.render("two",{data:data});

        }

    })
});
router.get('/sou1', function(req, res, next) {
    var data={};
    if(req.session.user) {
        data.user = req.session.user;
    }
    var keyword=req.query.keyword;
    var sql="select * from pili where name like '%"+keyword+"%' or jj like '%"+keyword+"%' or poem like '%"+keyword+"%'";
    db.query(sql,(err,result)=>{
        if(!err){
            data.pili=result;
            res.render("one",{data:data});
        }

    })
});
router.get('/sou2', function(req, res, next) {
    var data={};
    if(req.session.user) {
        data.user = req.session.user;
    }
    var keyword=req.query.keyword;
    var sql="select * from music where music_name like '%"+keyword+"%' or author like '%"+keyword+"%'";
    db.query(sql,(err,result)=>{
        if(!err){
            data.music=result;
            res.render("three",{data:data});
        }

    })
});

// 第三个页面
router.get('/three', function(req, res, next) {
    var data={};
    if(req.session.user) {
        data.user = req.session.user;
    }
    var sql="select * from music";
    db.query(sql,(err,result)=>{
        if(!err){
            data.music=result;
            res.render("three",{data:data})
        }

    })

});

// 添加页面
router.get("/add",function (req,res,next) {
    var data={};
    if(!req.session.user){
        res.redirect("/later/login");
    }else {
        data.user = req.session.user;
    }


    var sql = "select * from classify order by id";
    db.query(sql,function(error,category) {
        if (!error) {
            data.classify = category;
        }
        res.render("later/add",{data:data});
    })
})

// 添加页面上传数据
router.post("/store",upload.single('pic'),function (req,res,next) {
    var data={};
    if(req.session.user) {
        data.user = req.session.user;
    }
    var author_id=data.user.id;
    var title = req.body.title;
    var content = req.body.contenthtml;
    var content_text = req.body.contentmarkdown;
    var establish_time=moment().format("YYYY年MM月D日");
    var category={};
    category.id = req.body.category-1;

    db.query("select class_name from classify where class_id="+category.id,function (err,result) {
            if(!err){
                category.name=result[0].class_name;
            }

        if(req.file){
            var extname = path.extname(req.file.originalname);

            //存到数据库
            var newname = req.file.filename+extname;

            // 原来路径和名称oldpath  './public/uploads/39e20fdfa2400d433d04aad63f95e786'
            var oldpath = './public/uploads/'+req.file.filename;

            //改名后路径和名称
            var newpath = oldpath+extname;

            fs.rename(oldpath,newpath,(err)=>{

                if(!err) console.log("修改成功");
            })

        }else{
            var newname="a1.jpg";
        }


        var sql = "insert into study(title,content,classify_id,classify,img,content_text,author_id,establish_time)values(?,?,?,?,?,?,?,?)";
        var params = [title,content,category.id,category.name,newname,content_text,author_id,establish_time];
        db.query(sql,params,function(error,result){
            if(result.insertId>0){
                res.redirect("/from/two/"+category.id);

            }else{
                res.redirect("back");
            }
        });
    })
    // var user_id = req.session.user.id;

})
router.post("/upload",upload.single('editormd-image-file'),function (req,res,next) {
    if(req.file){
        var extname = path.extname(req.file.originalname);

        //存到数据库
        var newname = req.file.filename+extname;

        // 原来路径和名称oldpath  './public/uploads/39e20fdfa2400d433d04aad63f95e786'
        var oldpath = './public/uploads/'+req.file.filename;

        //改名后路径和名称
        var newpath = oldpath+extname;

        fs.rename(oldpath,newpath,(err)=>{

            if(!err) console.log("修改成功");
        })
        res.json({
            success :1,
            message : "上传成功",
            url     : "/uploads/"+newname
        })
    }else{
        res.json({
            success :0,
            message : "上传失败及错误。",
            url     : ""
        })
    }



})

//

module.exports = router;