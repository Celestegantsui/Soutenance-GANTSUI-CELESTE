<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Connexion</title>
</head>
<body>
    <h1>Connexion</h1>
    <form id="loginForm">
        <label>Email: <input type="email" id="email" required></label><br>
        <label>Mot de passe: <input type="password" id="password" required></label><br>
        <button type="submit">Se connecter</button>
    </form>

    <div id="message" style="margin-top:1rem;color:red"></div>

    <script>
    const form = document.getElementById('loginForm');
    const message = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        message.style.color = 'black';
        message.textContent = 'Connexion...';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const json = await res.json();

            if (!res.ok) {
                message.style.color = 'red';
                if (json.errors) {
                    message.textContent = Object.values(json.errors).flat().join(' ');
                } else if (json.message) {
                    message.textContent = json.message;
                } else {
                    message.textContent = 'Erreur inconnue';
                }
                return;
            }

            // Success: save token and show user
            localStorage.setItem('auth_token', json.token);
            localStorage.setItem('api_token', json.token);
            message.style.color = 'green';
            message.textContent = 'Connecté: ' + (json.user.name || json.user.email);
        } catch (err) {
            message.style.color = 'red';
            message.textContent = 'Erreur réseau: ' + err.message;
        }
    });
    </script>
</body>
</html>