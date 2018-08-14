window.onload = function () {
  var elStatus = document.getElementById('loginStatus');
  var btnLogout = document.getElementById('logout');

  // 登出
  if (btnLogout) {
    btnLogout.addEventListener('click', function (event) {
      event.preventDefault();
      fetch('/logout', {
        credentials: 'same-origin'
      }).then(function (res) {
        return res.json();
      }).catch(function (error) {
        console.error('Error:', error);
      }).then(function (data) {
        if (+data.code === 1) {
          window.location.href = '/';
        } else {
          elStatus.innerText = data.msg;
        }
      })
    })
  }
}