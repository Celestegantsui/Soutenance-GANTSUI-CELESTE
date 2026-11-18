@extends('layouts.app')

@section('title', 'Notifications - ARPCE')

@section('content')

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; gap: 20px;">
    <div class="page-header">
        <h1>Notifications</h1>
        <p>Gérez vos notifications et messages en attente</p>
    </div>
    <button id="mark-all-read-button" class="btn btn-primary" onclick="markAllAsRead()" disabled style="height: fit-content;">Tout marquer comme lu</button>
</div>

<div class="card">
    <div id="notifications-container">
        <div style="text-align: center; padding: 40px; color: var(--gray);">Chargement des notifications...</div>
    </div>
</div>

<script>
    let currentPage = 1;
    let isLoading = false;

    async function loadNotifications(page = 1, append = false) {
        if (isLoading) return;
        isLoading = true;

        const container = document.getElementById('notifications-container');

        if (!append) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--gray);">Chargement des notifications...</div>';
        }

        try {
            const response = await fetch(`/web-api/notifications?page=${page}&per_page=20`);

            if (!response.ok) throw new Error('Erreur de chargement');

            const data = await response.json();
            const notifications = data.notifications.data;

            if (!append) {
                container.innerHTML = '';
            }

            if (notifications.length === 0 && !append) {
                container.innerHTML = '<div class="no-data">Aucune notification</div>';
                toggleMarkAllReadButton(0);
                return;
            }

            notifications.forEach(notification => {
                const notificationElement = createNotificationElement(notification);
                container.appendChild(notificationElement);
            });

            currentPage = page;
            updateUnreadCount(data.unread_count);
            toggleMarkAllReadButton(data.unread_count);

        } catch (error) {
            console.error('Error loading notifications:', error);
            if (!append) {
                container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--danger);">Erreur lors du chargement des notifications</div>';
            }
        } finally {
            isLoading = false;
        }
    }

    function createNotificationElement(notification) {
        const div = document.createElement('div');
        div.style.cssText = `
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            background: white;
            border-left: 4px solid ${notification.is_read ? '#ccc' : 'var(--primary)'};
            transition: box-shadow 0.2s;
        `;
        div.dataset.id = notification.id;

        const timeAgo = formatTimeAgo(new Date(notification.created_at));

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div>
                    <h4 style="margin: 0; color: var(--gray-dark); font-size: 16px;">${notification.title}</h4>
                    <small style="color: var(--gray); margin-top: 4px; display: block;">${timeAgo}</small>
                </div>
            </div>
            <div style="color: var(--gray-dark); margin: 8px 0; line-height: 1.5;">${notification.message}</div>
            ${notification.sender ? `<div style="color: var(--gray); font-size: 12px; margin: 8px 0;">De: ${notification.sender.name}</div>` : ''}
            <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                <button class="btn btn-sm" style="padding: 6px 12px; background: white; border: 1px solid var(--border); cursor: pointer;" onclick="toggleReadStatus(${notification.id}, ${notification.is_read})">${notification.is_read ? '◯ Marquer non lu' : '● Marquer lu'}</button>
                <button class="btn btn-sm" style="padding: 6px 12px; background: white; border: 1px solid var(--border); color: var(--danger); cursor: pointer;" onclick="deleteNotification(${notification.id})">🗑️ Supprimer</button>
                ${notification.action_url ? `<button class="btn btn-sm btn-primary" style="padding: 6px 12px; cursor: pointer;" onclick="viewNotification(${notification.id}, '${notification.action_url}', ${notification.is_read})">👁️ Voir</button>` : ''}
            </div>
        `;

        return div;
    }

    async function toggleReadStatus(notificationId, currentlyRead) {
        try {
            const endpoint = currentlyRead ? 'unread' : 'read';
            const response = await fetch(`/web-api/notifications/${notificationId}/${endpoint}`, {
                method: 'PUT'
            });

            if (response.ok) {
                loadNotifications(1, false);
            }
        } catch (error) {
            console.error('Error toggling read status:', error);
        }
    }

    async function deleteNotification(notificationId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) return;

        try {
            const response = await fetch(`/web-api/notifications/${notificationId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadNotifications(1, false);
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }

    async function viewNotification(notificationId, actionUrl, isRead) {
        try {
            if (!isRead) {
                await fetch(`/web-api/notifications/${notificationId}/read`, {
                    method: 'PUT'
                });
            }

            // Extract task ID from actionUrl
            const taskId = actionUrl.split('/').pop();

            // Fetch task details
            const taskResponse = await fetch(`/web-api/tasks/${taskId}`);

            if (taskResponse.ok) {
                const task = await taskResponse.json();
                showTaskModal(task);
            } else if (taskResponse.status === 404) {
                // Task has been deleted or not found
                try {
                    const data = await taskResponse.json();
                    if (data.deleted) {
                        showDeletedTaskModal(data.error);
                    } else {
                        showDeletedTaskModal('Cette tâche a été supprimée par l\'administrateur');
                    }
                } catch (e) {
                    showDeletedTaskModal('Cette tâche a été supprimée par l\'administrateur');
                }
            } else {
                // Fallback to redirect
                window.location.href = actionUrl;
            }
        } catch (error) {
            console.error('Error viewing notification:', error);
            // Fallback to redirect
            window.location.href = actionUrl;
        }
    }

    async function markAllAsRead() {
        try {
            const response = await fetch('/web-api/notifications/mark-all-read', {
                method: 'PUT'
            });

            if (response.ok) {
                loadNotifications(1, false);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    function showTaskModal(task) {
        const modal = document.getElementById('task-modal');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Détails de la tâche</h2>
                <button class="close-btn" onclick="closeTaskModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <h4>Titre</h4>
                        <p><strong>${task.title}</strong></p>
                    </div>
                    <div>
                        <h4>Statut</h4>
                        <span style="
                            padding: 4px 10px;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: 600;
                            ${task.status === 'terminé' ? 'background: #f6ffed; color: #22863a;' : task.status === 'en cours' ? 'background: #e6f7ff; color: #0050b3;' : 'background: #fffbe6; color: #9d6e00;'}
                        ">
                            ${task.status || 'Non défini'}
                        </span>
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <h4>Description</h4>
                    <p>${task.description || 'Aucune description fournie.'}</p>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <h4>Créé par</h4>
                        <p>${task.createdBy || 'Inconnu'}</p>
                    </div>
                    <div>
                        <h4>Techniciens assignés</h4>
                        ${task.technicians && task.technicians.length > 0 ?
                            '<div style="display: flex; flex-wrap: wrap; gap: 5px;">' +
                            task.technicians.map(tech => `<span style="background: var(--primary); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${tech.name}</span>`).join('') +
                            '</div>' :
                            '<p>Aucun technicien assigné.</p>'
                        }
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4>Date de début</h4>
                        <p>${task.start_date ? new Date(task.start_date).toLocaleDateString('fr-FR') : '-'}</p>
                    </div>
                    <div>
                        <h4>Date de fin</h4>
                        <p>${task.end_date ? new Date(task.end_date).toLocaleDateString('fr-FR') : '-'}</p>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    function showDeletedTaskModal(errorMessage) {
        const modal = document.getElementById('task-modal');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Tâche supprimée</h2>
                <button class="close-btn" onclick="closeTaskModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 48px; color: #ff7a45; margin-bottom: 20px;">⚠️</div>
                    <h3 style="color: #d32f2f; margin-bottom: 10px;">Tâche supprimée</h3>
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        ${errorMessage}
                    </p>
                    <p style="color: #999; font-size: 14px; margin-top: 20px;">
                        Cette notification reste archivée, mais la tâche n'est plus disponible.
                    </p>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    function closeTaskModal() {
        document.getElementById('task-modal').style.display = 'none';
    }

    function toggleMarkAllReadButton(count) {
        const button = document.getElementById('mark-all-read-button');
        if (!button) return;
        button.disabled = count === 0;
        button.style.opacity = count === 0 ? '0.6' : '1';
    }

    function formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'À l\'instant';
        if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
        return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
    }

    function getToken() {
        return localStorage.getItem('auth_token') || localStorage.getItem('api_token') || '';
    }

    document.addEventListener('DOMContentLoaded', () => {
        loadNotifications();
    });
</script>

<!-- Task Details Modal -->
<div id="task-modal" class="modal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);">
    <div class="modal-content" style="background-color: white; margin: 5% auto; padding: 0; border-radius: 8px; width: 80%; max-width: 800px; max-height: 80%; overflow-y: auto;">
        <!-- Content will be populated by JavaScript -->
    </div>
</div>

<style>
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid var(--border);
    }
    .modal-header h2 {
        margin: 0;
        color: var(--gray-dark);
    }
    .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--gray);
    }
    .modal-body {
        padding: 20px;
    }
    .modal-body h4 {
        margin: 0 0 10px 0;
        color: var(--gray-dark);
        font-size: 16px;
    }
    .modal-body p {
        margin: 0 0 15px 0;
        line-height: 1.5;
    }
</style>

@endsection

            if (!append) {
                container.innerHTML = '<div class="loading">Chargement des notifications...</div>';
            }

            try {
                const response = await fetch(`/api/notifications?page=${page}&per_page=20`, {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) throw new Error('Erreur de chargement');

                const data = await response.json();
                const notifications = data.notifications.data;

                if (!append) {
                    container.innerHTML = '';
                }

                if (notifications.length === 0 && !append) {
                    container.innerHTML = '<p class="no-notifications">Aucune notification</p>';
                    return;
                }

                notifications.forEach(notification => {
                    const notificationElement = createNotificationElement(notification);
                    container.appendChild(notificationElement);
                });

                currentPage = page;
                updateUnreadCount(data.unread_count);

            } catch (error) {
                console.error('Error loading notifications:', error);
                if (!append) {
                    container.innerHTML = '<p class="error">Erreur lors du chargement des notifications</p>';
                }
            } finally {
                isLoading = false;
            }
        }

        function createNotificationElement(notification) {
            const div = document.createElement('div');
            div.className = `notification-card ${notification.is_read ? 'read' : 'unread'}`;
            div.dataset.id = notification.id;

            const timeAgo = formatTimeAgo(new Date(notification.created_at));

            div.innerHTML = `
                <div class="notification-header">
                    <div class="notification-title-group">
                        <span class="notification-status-dot ${notification.is_read ? 'read' : 'unread'}"></span>
                        <h3 class="notification-title">${notification.title}</h3>
                    </div>
                    <span class="notification-time">${timeAgo}</span>
                </div>
                <div class="notification-message">${notification.message}</div>
                ${notification.sender ? `<div class="notification-sender">De: ${notification.sender.name}</div>` : ''}
                <div class="notification-actions">
                    <button class="btn-mark-read" onclick="toggleReadStatus(${notification.id}, ${notification.is_read})">${notification.is_read ? 'Marquer non lu' : 'Marquer lu'}</button>
                    <button class="btn-delete" onclick="deleteNotification(${notification.id})">Supprimer</button>
                    ${notification.action_url ? `<button class="btn-action" onclick="viewNotification(${notification.id}, '${notification.action_url}', ${notification.is_read})">Voir</button>` : ''}
                </div>
            `;

            return div;
        }

        async function toggleReadStatus(notificationId, currentlyRead) {
            try {
                const endpoint = currentlyRead ? 'unread' : 'read';
                const response = await fetch(`/api/notifications/${notificationId}/${endpoint}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${getToken()}`,
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    loadNotifications(1, false);
                }
            } catch (error) {
                console.error('Error toggling read status:', error);
            }
        }

        async function deleteNotification(notificationId) {
            if (!confirm('�tes-vous s�r de vouloir supprimer cette notification ?')) return;

            try {
                const response = await fetch(`/api/notifications/${notificationId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${getToken()}`,
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    loadNotifications(1, false);
                }
            } catch (error) {
                console.error('Error deleting notification:', error);
            }
        }

        async function viewNotification(notificationId, actionUrl, isRead) {
            try {
                if (!isRead) {
                    await fetch(`/api/notifications/${notificationId}/read`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${getToken()}`,
                            'Accept': 'application/json'
                        }
                    });
                }
                window.location.href = actionUrl;
            } catch (error) {
                console.error('Error viewing notification:', error);
                window.location.href = actionUrl;
            }
        }

        async function markAllAsRead() {
            try {
                const response = await fetch('/api/notifications/mark-all-read', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${getToken()}`,
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    loadNotifications(1, false);
                }
            } catch (error) {
                console.error('Error marking all as read:', error);
            }
        }

        function updateUnreadCount(count) {
            const badges = document.querySelectorAll('.unread-badge');
            badges.forEach(badge => {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'inline' : 'none';
            });
            renderUnreadSummary(count);
            toggleMarkAllReadButton(count);
        }

        function renderUnreadSummary(count) {
            const summary = document.getElementById('unread-summary');
            if (!summary) return;
            summary.textContent = count > 0 ? `Vous avez ${count} message${count > 1 ? 's' : ''} non lu${count > 1 ? 's' : ''}` : 'Aucun message non lu';
        }

        function toggleMarkAllReadButton(count) {
            const button = document.getElementById('mark-all-read-button');
            if (!button) return;
            button.disabled = count === 0;
            button.style.opacity = count === 0 ? '0.6' : '1';
            button.textContent = count === 0 ? 'Rien � marquer comme lu' : 'Tout marquer comme lu';
        }

        function formatTimeAgo(date) {
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);

            if (diffInSeconds < 60) return '� l\'instant';
            if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
            if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
            return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
        }

        function getToken() {
            return localStorage.getItem('auth_token') || localStorage.getItem('api_token') || '';
        }

        document.addEventListener('DOMContentLoaded', () => {
            loadNotifications();
        });
    </script>

    <style>
        .notification-card {
            border: 1px solid var(--border-color);
            border-radius: 18px;
            padding: 18px;
            margin-bottom: 16px;
            background: #ffffff;
            transition: box-shadow 0.2s ease;
        }

        .notification-card:hover {
            box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
        }

        .notification-card.unread {
            border-color: var(--primary-color);
            background: #f7fbff;
        }

        .notification-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
        }

        .notification-title-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .notification-status-dot {
            width: 10px;
            height: 10px;
            border-radius: 999px;
            display: inline-block;
            margin-right: 10px;
        }

        .notification-status-dot.unread {
            background: var(--primary-color);
        }

        .notification-status-dot.read {
            background: #94a3b8;
        }

        .notification-title {
            margin: 0;
            font-size: 1rem;
            font-weight: 700;
            color: var(--text-color);
        }

        .notification-time {
            color: var(--muted-color);
            font-size: 0.85rem;
        }

        .notification-message,
        .notification-sender {
            color: var(--text-color);
            margin-bottom: 12px;
            line-height: 1.6;
        }

        .notification-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .btn-mark-read,
        .btn-delete,
        .btn-action {
            border: 1px solid var(--border-color);
            border-radius: 999px;
            padding: 10px 14px;
            font-size: 0.9rem;
            cursor: pointer;
            background: white;
            color: var(--text-color);
        }

        .btn-action {
            background: var(--primary-color);
            color: white;
            border-color: transparent;
        }

        .btn-delete {
            border-color: #f87171;
            color: #b91c1c;
        }

        .loading,
        .error,
        .no-notifications {
            text-align: center;
            padding: 40px;
            color: #666;
        }

        .error {
            color: #dc3545;
        }
    </style>
@endsection
