<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json([
                'message' => in_array('admin', $roles, true)
                    ? 'Accès réservé aux administrateurs.'
                    : "Accès refusé. Rôle(s) requis: " . implode(', ', $roles),
            ], 403);
        }

        return $next($request);
    }
}
