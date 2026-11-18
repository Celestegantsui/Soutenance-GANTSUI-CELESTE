<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use App\Notifications\Channels\DatabaseChannel;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Schema::defaultStringLength(191);

        // Register custom notification channel
        Notification::extend('database', function ($app) {
            return new DatabaseChannel();
        });

        // Share user's color preferences with all views
        View::composer('*', function ($view) {
            $defaultColors = [
                'primary_color' => '#87CEEB', // Bleu ciel pour techniciens (immuable)
                'secondary_color' => '#6c757d',
                'background_color' => '#ffffff',
                'text_color' => '#333333',
            ];

            $colors = $defaultColors;

            if (Auth::check()) {
                $user = Auth::user();

                // LES TECHNICIENS VOIENT TOUJOURS LES COULEURS PAR DÉFAUT
                // Même s'il existe des couleurs en base de données, on les ignore
                if ($user->isTechnician()) {
                    $colors = $defaultColors;
                }
                // Les admins voient leurs couleurs personnalisées
                // Si elles n'existent pas, on utilise les défauts
                elseif ($user->isAdmin()) {
                    // Utiliser UNIQUEMENT les couleurs personnalisées de cet admin
                    // Pas les défauts, mais les NULL si elles n'ont jamais été définies
                    $adminColors = [
                        'primary_color' => $user->primary_color,
                        'secondary_color' => $user->secondary_color,
                        'background_color' => $user->background_color,
                        'text_color' => $user->text_color,
                    ];

                    // Remplacer uniquement les valeurs NULL par les défauts
                    foreach ($defaultColors as $key => $defaultValue) {
                        $adminColors[$key] = $adminColors[$key] ?? $defaultValue;
                    }

                    $colors = $adminColors;
                }
            }

            $view->with('userColorPreferences', $colors);
        });
    }
}
