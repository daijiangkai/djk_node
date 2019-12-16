var express = require('express');
var router = express.Router();
var db=require('../database/db');
var jiami=require('../plugin/jiami');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.get('/logout', function(req, res, next) {
  req.session.destroy(function(err) {

    if(!err){
      res.redirect("/")
    }

  })

});

//用户个人中心
router.get('/info', function(req, res, next) {
  var data = {};
  if(req.session.error){
    data.error = req.session.error;
  }
  if(req.session.errors){
    data.error = req.session.errors;
  }
  if(req.session.user) {
    data.user = req.session.user;
  }
  var sql = "select * from users where id="+req.session.user.id;
  db.query(sql,function(error,results){

    if(!error){
      data.user = results[0];

      //req.session.user.userpwd = null;

      res.render("later/info.html",{data:data})
    }
  });

});
//用户信息修改
router.post('/info', function(req, res, next) {

  var user_id=req.session.user.id;
  var user_userpwd=jiami.md5(req.body.former_userpwd);
  db.query("select userpwd from users where id="+user_id,function (err,result) {
    console.log(result)
      if(!err){
        if(result[0].userpwd==user_userpwd){
          var new_pwd=jiami.md5(req.body.reuserpwd);
          var renew_pwd=jiami.md5(req.body.userpwd);
          if(new_pwd==renew_pwd) {
            var new_name = req.body.name;
            var new_email = req.body.email;

            var sql = " update users set name=\"" + new_name + "\",email=\"" + new_email + "\",userpwd=\"" + new_pwd + "\" where id=\"" + user_id + "\"";

            db.query(sql, (err, result) => {
              if (!err) {
                db.query("select * from users where id=" + user_id, (err, result) => {
                  if (!err) {
                    req.session.user = result[0];
                    res.redirect("/")
                  }
                });
              } else {
                res.redirect("back");
              }
            })
          }else {
            req.session.errors = {
              message: "俩次密码输入不一致"
            }
            res.redirect("back");
          }
        }else {
          req.session.error = {
            message: "密码输入错误"
          }
          res.redirect("back");
        }
      }
  })


});

module.exports = router;
