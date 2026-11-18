<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Auth;

class UserPreferencesController extends Controller
{
    /**
     * Show the preferences page (admin only)
     */
    public function show()
    {
        // Vérifier que l'utilisateur est admin
        if (!Auth::user()->isAdmin()) {
            return redirect()->back()->with('error', 'Non autorisé - Seuls les administrateurs peuvent accéder aux préférences');
        }

        $user = Auth::user();
        return view('preferences', [
            'primaryColor' => $user->primary_color ?? '#87CEEB',
            'secondaryColor' => $user->secondary_color ?? '#6c757d',
            'backgroundColor' => $user->background_color ?? '#ffffff',
            'textColor' => $user->text_color ?? '#333333',
        ]);
    }

    /**
     * Update the user's color preferences (admin only)
     */
    public function update(Request $request)
    {
        // Vérifier que l'utilisateur est admin
        if (!Auth::user()->isAdmin()) {
            return response()->json(['error' => 'Non autorisé - Seuls les administrateurs peuvent modifier les couleurs'], 403);
        }

        $validated = $request->validate([
            'primary_color' => 'nullable|regex:/^#[0-9A-F]{6}$/i',
            'secondary_color' => 'nullable|regex:/^#[0-9A-F]{6}$/i',
            'background_color' => 'nullable|regex:/^#[0-9A-F]{6}$/i',
            'text_color' => 'nullable|regex:/^#[0-9A-F]{6}$/i',
        ]);

        $user = Auth::user();
        $user->update($validated);

        return response()->json([
            'message' => 'Préférences de couleur mises à jour avec succès pour votre compte',
            'colors' => [
                'primary_color' => $user->primary_color,
                'secondary_color' => $user->secondary_color,
                'background_color' => $user->background_color,
                'text_color' => $user->text_color,
            ]
        ]);
    }
}
