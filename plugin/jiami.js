module.exports = {
    // 使用md5加密密码
    md5:function(password){
        // 加密密码(原生模块-c++的模块)
        var crypto = require('crypto');

        // 创建hash加密的方式
        var md5 = crypto.createHash('md5');

        // 加密
        md5.update(password);

        // 获取加密结果
        return md5.digest('hex');
    }
}