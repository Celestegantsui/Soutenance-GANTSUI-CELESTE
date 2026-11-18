<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\HistoryController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ✅ AUTHENTICATION ROUTES (Public)
Route::post('/login', [AuthController::class, 'login']);

// ✅ PUBLIC ROUTES
Route::get('/technicians', [UserController::class, 'index']);

// ✅ PROTECTED ROUTES (require authentication)
Route::middleware(['auth:sanctum', 'active'])->group(function () {

    // ✅ TASK ROUTES
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/{id}', [TaskController::class, 'show']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{id}', [TaskController::class, 'update']);

    // ✅ NOTIFICATION ROUTES
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::get('/notifications/{id}', [NotificationController::class, 'show']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/{id}/unread', [NotificationController::class, 'markAsUnread']);
    Route::post('/notifications/{id}/unread', [NotificationController::class, 'markAsUnread']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::post('/notifications/delete-many', [NotificationController::class, 'deleteMany']);

    // ✅ AUTHENTICATION ROUTES
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // ✅ ROUTES DE GESTION DES UTILISATEURS (Réservées à l’administrateur)
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'managementIndex']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });

    // ✅ HISTORY ROUTE (Admin only)
    Route::middleware('role:admin')->group(function () {
        // Archives mensuelles pour la page Historique
        Route::get('/history/monthly', [HistoryController::class, 'monthly']);
        Route::get('/history/dashboard', [HistoryController::class, 'dashboard']);

        // Delete tasks
        Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);

        // History & Restoration
        Route::get('/tasks-history', [TaskController::class, 'history']);
        Route::post('/tasks/{id}/restore', [TaskController::class, 'restore']);
        Route::post('/tasks/restore-many', [TaskController::class, 'restoreMany']);
        Route::post('/tasks/{id}/force-delete', [TaskController::class, 'forceDelete']);
        Route::post('/tasks/force-delete-many', [TaskController::class, 'forceDeleteMany']);
    });
});