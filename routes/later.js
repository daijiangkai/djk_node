var express = require('express');
var router = express.Router();
var db=require('../database/db');
var multer = require("multer");
var path = require("path");
var fs = require("fs");
var jiami=require("../plugin/jiami");
var moment=require('moment');

var upload = multer({ dest: './public/uploads/' });

//用户注册界面
router.get('/registor', function(req, res, next) {
    var data = {};
    if(req.session.error){
        data.error = req.session.error;
    }
    res.render("later/registor",{data:data})
    req.session.destroy();
});

//用户注册信息提交数据库
router.post('/registor', function(req, res, next) {
    var name = req.body.username;
    var userpwd =jiami.md5(req.body.userpwd);
    var reuserpwd =jiami.md5(req.body.reuserpwd);
    var email = req.body.email;
    //获取IP地址 var last_ip = req.ip;
    if(userpwd != reuserpwd) {
        req.session.error = {
            message: "两次密码输入错误"
        }
        res.redirect("back");
    }else {
        var sql = "insert into users(name,userpwd,email)values(?,?,?)";
        var params = [name, userpwd, email];

        db.query(sql, params, function (error, result) {

            if (!error && result.insertId > 0) {
                req.session.user = {
                    id: result.insertId,
                    name: name,
                    email: email,
                    head_img:"headpicture.png"
                }
                res.redirect("/")
            } else {

                res.redirect("back");
            }
        })
    }
});

router.get('/show/:id', function(req, res, next) {
    var data={};
    if(req.session.user) {
        data.user = req.session.user;
    }
    data.id=req.params.id;
    var sql="select * from pili where id="+data.id;
    db.query(sql,(err,result)=>{
        if(!err){
            var sql="update pili set view=view+1 where id="+result[0].id;
            db.query(sql,(err,result)=>{
                if(!err){
                    console.log("更新成功");
                }
            });
            data.text=result[0];
            if(result[0].poem) {
                var str = result[0].poem;
                data.text.poem = str.split("<br/>");
            }
                var jj = result[0].jj;
                data.text.jj = jj.split("<br/>");

            res.render("later/show",{data:data});
        }
    })
});


//跳到文章详情页面
router.get('/study/:id', function(req, res, next) {
    var data={};
    data.id=req.params.id;
    if(req.session.user) {
        data.user = req.session.user;
        var reader_id=data.user.id;
        console.log(reader_id)
        var sql="select * from likenum where reader_id="+reader_id+" and article_id="+data.id;
        db.query(sql,function (err,result) {
            if(!err && result[0]){
                data.like=true;
            }else {
                data.like=false;
            }



        })

    }

    var sql="select * from classify";  //查询文章分类表
    db.query(sql,(err,result)=>{
        if(!err){
            data.classify=result;
        }
    });

    db.query("select * from study order by view desc limit 10 ",function (err,result) {
        if(!err){
            data.study_xu=result;
        }
    })


    sql="select * from comments where c_study_id="+data.id; //通过文章id查询评论表
    db.query(sql,function (err,result) {
        if(!err){
            data.comment=result;
        }
    })
    sql="select * from study where id="+data.id;  //通过文章id查询文章详情
    db.query(sql,(err,result)=>{
        if(!err){
            sql="update study set view=view+1 where id="+result[0].id;  //更新文章阅读次数
            db.query(sql,(err,result)=>{
                if(!err){
                    console.log("更新成功");
                }
            });
            data.study=result[0];
            sql = "select name from users where id="+result[0].author_id;  //查询文章作者
            db.query(sql,(err,result)=>{
                if(!err) {
                    data.author_name=result[0].name;
                    res.render("later/study", {data: data});
                }
            })


        }
    })

});

//评论
router.post('/study/:id', function(req, res, next) {
    var data={};
    if(req.session.user){
        data.user = req.session.user;

        var comment=req.body.comment;
        if(comment!="") {
            var study_id = req.params.id;
            var user_id = data.user.id;
            var user_img = data.user.head_img;
            var time = moment().format("YYYY年MM月D日，H：mm");
            var name = data.user.name;
            var sql = "insert into comments(c_comment_count,c_study_id,c_user_id,c_comment_time,c_user_img,c_user_name)values(?,?,?,?,?,?)"
            var params = [comment, study_id, user_id, time, user_img, name];
            db.query(sql, params, function (err, result) {
                if (!err && result.insertId > 0) {
                    res.redirect("/later/study/" + study_id);
                }
            })
        }else {
            //输入为空返回
            res.redirect("back");
        }
    }else {
        //没有登陆，跳到登陆页面
        res.redirect("/later/login")
    }
})

//登陆
router.get('/login', function(req, res, next) {
    var data = {};

    if(req.session.user){
        data.user = req.session.user;
    }
    res.render('later/login',{data:data});
})
router.post('/login', function(req, res, next) {
    var data = {};

    var name = req.body.name;
    var userpwd =jiami.md5(req.body.userpwd);
    var sql = "select *from users where name='"+name+"' and userpwd='"+userpwd+"'";
    db.query(sql,function (error,result) {
        if(result.length>0){
            req.session.user = result[0];
            res.redirect("/");
        }else {
            res.redirect("back");
        }
    })
})
// 更换头像
router.get('/headpicture', function(req, res, next) {
    var data = {};
    if (req.session.user) {
        data.user = req.session.user;
    }

    res.render('later/headpicture',{data:data});
})
router.post('/headpicture', upload.single('pic'),function(req, res, next) {
    var data = {};
    if (req.session.user) {
        data.user = req.session.user;
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
        var sql="update users set head_img='"+newname+"' where id="+req.session.user.id;
        db.query(sql,(err,result)=> {
            if (!err && result.affectedRows > 0) {
                req.session.user.head_img=newname;
                data.user.head_img=newname;
                res.render('later/headpicture', {data: data});
            }
        })

    } else {
        res.redirect("back");
    }

});

// 修改  1.页面跳转
router.get('/revamp/:id',function(req,res,next){
    var data={};
    if(req.session.user) {
        data.user = req.session.user;
    }
    var sql="select * from classify";
    db.query(sql,function (err,result) {
        if(!err && result.length>0){
            data.classify=result;
        }
    })
    data.id=req.params.id;
    var sql ="select * from study where id="+data.id;
    db.query(sql,function (err,result) {
        if(!err && result.length>0){
            data.study=result[0];
            res.render('later/revamp',{data:data});
        }
    })
});

// 修改  2.信息重新上传
router.post("/store",upload.single('pic'),function (req,res,next) {
    var data={};
    if(req.session.user) {
        data.user = req.session.user;
    }
    var id=parseInt(req.body.id);
    var title = req.body.title;
    var content = req.body.contenthtml;
    var content_text=req.body.contentmarkdown;
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
            var sql = "update study set title=?,content=?,classify_id=?,classify=?,img=?,content_text=? where id=?";
            var params = [title,content[0],category.id,category.name,newname,content_text,id];
        }else{
            var sql = "update study set title=?,content=?,classify_id=?,classify=?,content_text=? where id=?";
            var params = [title,content[0],category.id,category.name,content_text,id];
        }
        db.query(sql,params,function(error,result){
            if(result.affectedRows>0){

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



});

// 删除
router.get("/del/:id",function (req,res,next) {
    var data={};
    if(req.session.user) {
        data.user = req.session.user;
    }
    data.id=req.params.id;
    var sql="delete from study where id="+data.id;
    db.query(sql,function (err,result) {
        if(!err && result.affectedRows>0){
            res.redirect("back");
        }else{
            res.redirect("back");
        }
    })
});

// 点赞
router.post("/like_s",function (req,res,next) {
    var data={};
    if(req.session.user){
        data.user = req.session.user;

        var reader_id=data.user.id;
        var reader_name=data.user.name;
        var study_id=parseInt(req.body.study_id);
        var like=req.body.dianzan;
        var sql="update study set like_s="+like+" where id="+study_id;
        db.query(sql,like,function (err,result) {
            if(!err){
                console.log("点赞成功");
            }
        });
        sql="insert into likenum(reader_id,reader_name,article_id)values(?,?,?)";
        var qu=[reader_id,reader_name,study_id]
        db.query(sql,qu,function (err,result) {
            if(!err && result.insertId>0){
                console.log("插入成功");
            }
        })
    }
})
router.post("/like_j",function (req,res,next) {
    var data={};
    if(req.session.user){
        data.user = req.session.user;

        var reader_id=data.user.id;
        var study_id=parseInt(req.body.study_id);
        var like=req.body.dianzan;



        var sql="update study set like_s="+like+" where id="+study_id;
        db.query(sql,like,function (err,result) {
            if(!err){
                console.log("更改成功");
            }
        });
        sql="delete from likenum where reader_id="+reader_id+" and article_id="+study_id;
        db.query(sql,function (err,result) {
            if(!err && result.affectedRows>0){
                console.log("删除成功");
            }
        })
    }
})
module.exports = router;