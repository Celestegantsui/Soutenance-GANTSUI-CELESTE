<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserPreferencesController;
use App\Http\Controllers\HistoryController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Web page routes (not API)
Route::middleware('auth')->group(function () {
    // Dashboard
    Route::get('/home', function () {
        $tasksCount = \App\Models\Task::where('status', '!=', 'terminé')->count();
        $completedTasksCount = \App\Models\Task::where('status', 'terminé')->count();
        $techniciansCount = \App\Models\User::active()->where('role', 'technicien')->count();
        $newNotificationsCount = auth()->user()->unreadNotifications()->count();
        $recentTasks = \App\Models\Task::latest()->limit(5)->get();

        return view('dashboard', compact('tasksCount', 'completedTasksCount', 'techniciansCount', 'newNotificationsCount', 'recentTasks'));
    })->name('home');

    // Tasks
    Route::get('/tasks', [TaskController::class, 'webIndex'])->name('tasks.index');
    Route::get('/tasks/create', [TaskController::class, 'create'])->name('tasks.create');
    Route::post('/tasks', [TaskController::class, 'webStore'])->name('tasks.store');
    Route::get('/tasks/{id}', [TaskController::class, 'webShow'])->name('tasks.show');
    Route::patch('/tasks/{id}', [TaskController::class, 'webUpdate'])->name('tasks.update');

    // User preferences
    Route::get('/history', [HistoryController::class, 'webIndex'])->name('history.index');

    Route::get('/preferences', [UserPreferencesController::class, 'show'])->name('preferences');
    Route::post('/preferences', [UserPreferencesController::class, 'update'])->name('preferences.update');

    // Logout
    Route::post('/logout', function () {
        Auth::logout();
        return redirect('/login');
    })->name('logout');

    // Web API routes for notifications (using session auth)
    Route::prefix('web-api')->group(function () {
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
        Route::get('/notifications/{id}', [NotificationController::class, 'show']);
        Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/notifications/{id}/unread', [NotificationController::class, 'markAsUnread']);
        Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

        // Task details for modal
        Route::get('/tasks/{id}', [TaskController::class, 'show']);
    });
});

// Comments route - requires authentication (only registered users can comment)
Route::middleware('auth')->post('/tasks/{id}/comments', [TaskController::class, 'webStoreComment'])->name('tasks.comments.store');

// Login route (outside auth middleware)

// Login route (outside auth middleware)
Route::get('/login', function () {
    return view('login');
})->name('login');

// Export PDF route can use Laravel session or api_token query if the frontend does not send a session cookie.
Route::get('/tasks/export/pdf', [TaskController::class, 'exportPdf'])->name('tasks.export.pdf');

// Public task view route (no auth required - for notifications/external links)
// Must be placed before auth middleware group to avoid conflicts
Route::get('/notification/task/{id}', [TaskController::class, 'webShow'])->name('tasks.show-public');

// Always redirect notifications to frontend notifications page
Route::get('/notifications', function () {
    return redirect()->away(env('FRONTEND_URL', 'http://localhost:3000') . '/notifications');
})->name('notifications.index');

// Default route
Route::get('/', function () {
    return view('welcome');
});
