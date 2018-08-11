const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

const app = express();

const identityKey = 'session-test';
app.use(session({
  name: identityKey,
  secret: 'test', // 用来对session id相关的cookie进行签名
  store: new FileStore(), // 本地存储session（文本文件，也可以选择其他store，比如redis的）
  saveUninitialized: false, // 是否自动保存未初始化的会话，建议false
  resave: false, // 是否每次都重新保存会话，建议false
  cookie: {
    maxAge: 10 * 1000 // 有效期，单位是毫秒
  }
}));

//设置模板引擎为ejs, 模板路径
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false
}))
// parse application/json
app.use(bodyParser.json())

const users = require('./data/user').users;
const findUser = (name, password) => {
  return users.find((user) => {
    return user.name === name && user.password === password;
  });
};

// 访问首页
app.get('/', (req, res) => {
  const sess = req.session;
  const loginUser = sess.loginUser;
  const isLogined = !!loginUser;

  console.log(isLogined, loginUser);

  res.render('index', {
    isLogined: isLogined,
    name: loginUser || ''
  });
});

// 登录
app.post('/login', (req, res) => {
  const user = findUser(req.body.name, req.body.password);
  if (user) {
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
    res.redirect('/');
  });
});

app.listen(3000, () => {
  console.log(`The server is running at http://127.0.0.1:3000`)
})