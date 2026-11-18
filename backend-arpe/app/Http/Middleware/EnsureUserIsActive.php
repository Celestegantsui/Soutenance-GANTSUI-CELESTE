<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && method_exists($user, 'isActive') && !$user->isActive()) {
            if ($user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }

            return response()->json([
                'message' => 'Votre compte est inactif. Vous ne recevez plus de notifications.',
            ], 403);
        }

        return $next($request);
    }
}
