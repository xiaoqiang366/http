const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');
const fs = require('fs');

const app = express();

const identityKey = 'session-test';
app.use(session({
  name: identityKey,
  secret: 'test', // 用来对session id相关的cookie进行签名
  store: new FileStore(), // 本地存储session（文本文件，也可以选择其他store，比如redis的）
  saveUninitialized: false, // 是否自动保存未初始化的会话，建议false
  resave: false, // 是否每次都重新保存会话，建议false
  cookie: {
    maxAge: 10 * 60 * 1000 // 有效期，单位是毫秒
  }
}));

// 用户信息登录查找验证
// type -> 'check' 用户登录验证; type -> 'find' 查找用户
const findUser = (type = 'find', name, password) => {
  const userStr = fs.readFileSync(path.join(__dirname, '/data/user.json'), 'utf8');
  const users = userStr ? JSON.parse(userStr) : [];
  return users.find((user) => {
    if (type === 'find') {
      return user.name === name;
    } else {
      return user.name === name && user.password === password;
    }
  });
};

//设置模板引擎为ejs, 模板路径
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({
  extended: false
})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json


//登录拦截器，必须放在静态资源声明之后、路由导航之前
app.use( (req, res, next) => {
  var url = req.originalUrl;
  if (url === '/userInfo' && !req.session.loginUser) {
    return res.redirect('/login.html');
  }
  next();
});

// 首页
app.get('/', (req, res) => {
  const loginUser = req.session.loginUser;
  const isLogined = !!loginUser;

  res.render('index', {
    isLogined: isLogined,
    name: loginUser || ''
  });
});

// 登录
app.post('/login', (req, res) => {
  const user = findUser('check', req.body.name, req.body.password);
  if (!!user) {
    req.session.regenerate((err) => {
      if (err) {
        return res.json({
          code: -1,
          msg: '登录失败'
        });
      }
      req.session.loginUser = user.name;
      res.json({
        code: 1,
        msg: '登录成功'
      });
    });
  } else {
    res.json({
      code: -1,
      msg: '账号或密码错误'
    });
  }
})

// 退出
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.json({
        code: -1,
        msg: '退出登录失败'
      });
      return;
    }
    res.clearCookie(identityKey);
    res.json({
      code: 1,
      msg: '退出ok'
    });
  });
});

// 注册
app.post('/reg', (req, res) => {
  if (req.body.name && req.body.password) {
    const user = {
      name: req.body.name,
      password: req.body.password
    };
    const isExist = findUser('find', user.name, user.password);
    if (isExist) {
      res.json({
        code: -1,
        msg: '注册失败, 用户已存在'
      });
      return;
    }
    const userStr = fs.readFileSync(path.join(__dirname, '/data/user.json'), 'utf8');
    const users = userStr ? JSON.parse(userStr) : [];
    users.push(user);
    fs.writeFile(path.join(__dirname, '/data/user.json'), JSON.stringify(users), (err) => {
      if (err) {
        res.json({
          code: -1,
          msg: '注册失败',
          data: err.stack
        });
        throw err;
      };
      res.json({
        code: 1,
        msg: '注册成功'
      });
    });
  } else {
    res.json({
      code: -1,
      msg: '注册参数错误'
    });
  }
})

app.listen(3000, () => {
  console.log(`The server is running at http://127.0.0.1:3000`)
})