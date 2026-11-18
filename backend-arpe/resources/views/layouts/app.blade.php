<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'ARPCE - Gestion des Tâches')</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <div class="app-layout">
        <!-- SIDEBAR -->
        <aside class="sidebar">
            <div style="padding: 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.2); margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 22px; color: white; font-weight: bold;">ARPCE</h2>
                <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">Gestion des Tâches</p>
            </div>

            <nav>
                <ul class="sidebar-menu">
                    <li>
                        <a href="{{ route('home') }}" class="@if(request()->routeIs('home')) active @endif">
                            <span class="sidebar-menu-icon">📊</span>
                            <span class="sidebar-menu-text">Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('tasks.index') }}" class="@if(request()->routeIs('tasks.*')) active @endif">
                            <span class="sidebar-menu-icon">✓</span>
                            <span class="sidebar-menu-text">Tâches</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('notifications.index') }}" class="@if(request()->routeIs('notifications.*')) active @endif">
                            <span class="sidebar-menu-icon">🔔</span>
                            <span class="sidebar-menu-text">Notifications</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" onclick="alert('Réunion du vendredi'); return false;">
                            <span class="sidebar-menu-icon">📅</span>
                            <span class="sidebar-menu-text">Réunion du vendredi</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('history.index') }}" class="@if(request()->routeIs('history.*')) active @endif">
                            <span class="sidebar-menu-icon">📜</span>
                            <span class="sidebar-menu-text">Historique</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>

        <!-- MAIN CONTENT -->
        <div class="main-content">
            <!-- HEADER -->
            <header class="header">
                <div class="header-brand">
                    <h2>ARPCE</h2>
                </div>
                <div class="header-actions">
                    <span style="color: var(--gray-dark);">@if(Auth::check()) {{ Auth::user()->name }} @endif</span>
                    <div class="user-menu">
                        <form action="{{ route('logout') }}" method="POST" style="display: inline;">
                            @csrf
                            <button type="submit" class="logout-btn">Déconnexion</button>
                        </form>
                    </div>
                </div>
            </header>

            <!-- CONTENT -->
            <main class="content">
                @if(session('success'))
                    <div class="alert alert-success">
                        ✓ {{ session('success') }}
                    </div>
                @endif

                @if($errors->any())
                    <div class="alert alert-danger">
                        <strong>Erreurs:</strong>
                        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                            @foreach($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                @yield('content')
            </main>
        </div>
    </div>

    <script>
        // Auto-hide alerts after 5 seconds
        document.addEventListener('DOMContentLoaded', function() {
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach(alert => {
                setTimeout(() => {
                    alert.style.transition = 'opacity 0.3s';
                    alert.style.opacity = '0';
                    setTimeout(() => alert.remove(), 300);
                }, 5000);
            });
        });
    </script>
</body>
</html>