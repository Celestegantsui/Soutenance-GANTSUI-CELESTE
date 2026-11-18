<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        if (!$user->isActive()) {
            $perPage = (int) $request->get('per_page', 20);

            return response()->json([
                'notifications' => Notification::forUser($user->id)
                    ->whereRaw('1 = 0')
                    ->paginate($perPage),
                'unread_count' => 0,
            ]);
        }

        $query = Notification::forUser($user->id)
            ->with(['sender'])
            ->orderBy('created_at', 'desc');

        // Pagination
        $perPage = $request->get('per_page', 20);
        $notifications = $query->paginate($perPage);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => Notification::forUser($user->id)->unread()->count()
        ]);
    }

    public function show($id): JsonResponse
    {
        $user = auth()->user();
        $notification = Notification::forUser($user->id)->findOrFail($id);

        // Mark as read if not already
        if (!$notification->is_read) {
            $notification->markAsRead();
        }

        return response()->json($notification->load(['sender']));
    }

    public function markAsRead($id): JsonResponse
    {
        $user = auth()->user();
        $notification = Notification::forUser($user->id)->findOrFail($id);

        $notification->markAsRead();

        return response()->json(['message' => 'Notification marquée comme lue']);
    }

    public function markAsUnread($id): JsonResponse
    {
        $user = auth()->user();
        $notification = Notification::forUser($user->id)->findOrFail($id);

        $notification->markAsUnread();

        return response()->json(['message' => 'Notification marquée comme non lue']);
    }

    public function markAllAsRead(): JsonResponse
    {
        $user = auth()->user();

        Notification::forUser($user->id)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now()
            ]);

        return response()->json(['message' => 'Toutes les notifications ont été marquées comme lues']);
    }

    public function destroy($id): JsonResponse
    {
        $user = auth()->user();
        $notification = Notification::forUser($user->id)->findOrFail($id);

        $notification->delete();

        return response()->json(['message' => 'Notification supprimée']);
    }

    public function getUnreadCount(): JsonResponse
    {
        $user = auth()->user();

        return response()->json([
            'unread_count' => $user->isActive()
                ? Notification::forUser($user->id)->unread()->count()
                : 0,
        ]);
    }

    // Web routes
    public function webIndex()
    {
        return view('notifications.index');
    }
    public function deleteMany(Request $request): JsonResponse
{
    $user = auth()->user();

    $ids = $request->validate([
        'ids' => 'required|array',
        'ids.*' => 'integer'
    ])['ids'];

    Notification::forUser($user->id)
        ->whereIn('id', $ids)
        ->delete();

    return response()->json([
        'message' => 'Notifications supprimées',
        'count' => count($ids)
    ]);
}
}

