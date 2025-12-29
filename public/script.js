async function login(event) {
    if (event) event.preventDefault();
    var user = document.getElementById("username").value;
    var pass = document.getElementById("password").value;
    var content = document.getElementById("content");
    var loginBlock = document.getElementById("login-block"); 
    var mainNav = document.getElementById("main-nav");     

    if (!user || !pass) {
        alert("Введите логин и пароль!");
        return;
    }

    content.innerHTML = '<h2>Связываемся с Kalys...</h2>';

    try {
        // Отправляем запрос на наш Node.js сервер
        let response = await fetch(`/api/tasks?user=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`);
        
        if (response.ok) {
            let tasks = await response.json();
            loginBlock.style.display = "none";
            mainNav.style.display = "flex";
            
            content.innerHTML = `
                <h2 style="color: #27ae60;">Вход выполнен успешно! 🎉</h2>
                <p>Ваш аккаунт: <b>${user}</b></p>
                <p>Найдено задач: ${tasks.length}</p>
            `;
            // Сразу отображаем задачи после входа
            renderTasks(tasks, "Все задачи");
        } else {
            content.innerHTML = '<h2 style="color:red">Ошибка: Неверный логин или пароль</h2>';
        }
    } catch (err) {
        content.innerHTML = '<h2 style="color:red">Ошибка соединения с сервером</h2>';
        console.error(err);
    }
}

async function loadAndRender(endpoint, title) {
    var content = document.getElementById("content");
    var user = document.getElementById("username").value;
    var pass = document.getElementById("password").value;

    content.innerHTML = '<h2>' + title + '</h2><p>Загрузка данных...</p>';

    try {
        let url = `${endpoint}?user=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`;
        let res = await fetch(url);
        if (!res.ok) throw new Error("Ошибка сервера");
        
        let tasks = await res.json();
        renderTasks(tasks, title);
    } catch (err) {
        content.innerHTML = '<p style="color:red">Ошибка загрузки списка задач</p>';
    }
}

function renderTasks(tasks, title) {
    var content = document.getElementById("content");
    var pass = document.getElementById("password").value;

    if (!tasks || tasks.length === 0) {
        content.innerHTML = `<h2>${title}</h2><p>Список пуст</p>`;
        return;
    }

    let html = `<h2>${title} (${tasks.length})</h2>
                <p>Нажми на задачу, чтобы скопировать пароль и перейти на сайт.</p>
                <table border="1" cellpadding="8" style="width:100%; border-collapse: collapse;">
                <tr><th>#</th><th>Задача</th><th>Статус</th></tr>`;

    tasks.forEach((t, i) => {
        const color = t.solved ? "green" : "#007bff";
        const onClickAction = `copyToClipboard('${pass}', 'Пароль скопирован!')`;
        
        html += `<tr>
            <td>${i + 1}</td>
            <td><a href="${t.url}" target="_blank" onclick="${onClickAction}" style="color:${color}; font-weight:bold; text-decoration:none;">${t.title}</a></td>
            <td>${t.solved ? '✅' : '❌'}</td>
        </tr>`;
    });

    content.innerHTML = html + '</table>';
}

function copyToClipboard(text, message) {
    const dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    
    const tip = document.createElement("div");
    tip.style = "position:fixed; top:20px; right:20px; background: #27ae60; color:white; padding:10px; border-radius:5px; z-index:1000;";
    tip.innerText = message;
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 2000);
}

function showHome() {
    document.getElementById("login-block").style.display = "block";
    document.getElementById("main-nav").style.display = "none";
    document.getElementById("content").innerHTML = "<h2>Вы вышли из системы</h2>";
    document.getElementById("password").value = "";
}

function loadTasks() { loadAndRender('/api/tasks', 'Все задачи'); }
function loadSolved() { loadAndRender('/api/solved', 'Выполненные задачи'); }