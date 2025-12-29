const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
console.log("PWD:", process.cwd());


const app = express();
app.use(cors());
app.use(express.static('public')); // Для твоих HTML/JS файлов

const LOGIN_URL = "https://kalys.bolotbekov.kg/accounts/login/";
const TASKS_URL = "https://kalys.bolotbekov.kg/tasks/";

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
};

// Функция для получения авторизованной сессии
async function getSession(username, password) {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true }));

    try {
        // 1. Получаем страницу логина для CSRF токена
        const loginPage = await client.get(LOGIN_URL, { headers: HEADERS });
        const $ = cheerio.load(loginPage.data);
        const csrfToken = $('input[name="csrfmiddlewaretoken"]').val();

        if (!csrfToken) throw new Error("CSRF token not found");

        // 2. Выполняем POST запрос для входа
        const params = new URLSearchParams();
        params.append('csrfmiddlewaretoken', csrfToken);
        params.append('username', username);
        params.append('password', password);
        params.append('next', '/tasks/');

        const response = await client.post(LOGIN_URL, params, {
            headers: {
                ...HEADERS,
                "Referer": LOGIN_URL,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            maxRedirects: 5
        });

        // Проверка успешности: если мы все еще на странице логина, значит пароль неверный
        if (response.data.includes('name="password"')) {
            return null;
        }

        return client;
    } catch (error) {
        console.error("Ошибка авторизации:", error.message);
        return null;
    }
}

// Общая функция для получения задач
async function fetchTasks(username, password, solvedOnly = false) {
    const client = await getSession(username, password);
    if (!client) return null;

    try {
        const response = await client.get(TASKS_URL, { headers: HEADERS });
        const $ = cheerio.load(response.data);
        const tasks = [];
        const seenTitles = new Set();

        // Ищем ссылки в таблице
        $("table tr td a").each((i, el) => {
            const $link = $(el);
            const title = $link.text().trim();
            let href = $link.attr('href') || '';

            // Фильтрация мусора (как в твоем Python коде)
            if (!title || title.length < 3 || ["отправить", "решение", "вход", "выйти"].includes(title.toLowerCase())) {
                return;
            }

            const fullUrl = href.startsWith('/') ? `https://kalys.bolotbekov.kg${href}` : href;
            const style = $link.attr('style') || '';
            const isSolved = style.toLowerCase().includes('color: green');

            if (solvedOnly && !isSolved) return;

            if (!seenTitles.has(title)) {
                tasks.push({
                    title: title,
                    url: fullUrl,
                    solved: isSolved
                });
                seenTitles.add(title);
            }
        });

        return tasks;
    } catch (error) {
        console.error("Ошибка парсинга задач:", error.message);
        return [];
    }
}

// Эндпоинты API
app.get("/api/tasks", async (req, res) => {
    const { user, password } = req.query;
    const result = await fetchTasks(user, password, false);
    if (result === null) return res.status(401).json({ error: "Auth failed" });
    res.json(result);
});

app.get("/api/solved", async (req, res) => {
    const { user, password } = req.query;
    const result = await fetchTasks(user, password, true);
    if (result === null) return res.status(401).json({ error: "Auth failed" });
    res.json(result);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
