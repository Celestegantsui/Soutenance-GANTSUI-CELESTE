@extends('layouts.app')

@section('title', 'Détails de la tâche - ARPCE')

@section('content')
<style>
.task-details-container {
    background-color: #F4F7FB;
    min-height: 100vh;
    padding: 24px 24px 40px;
}

.back-link {
    color: #1D4ED8;
    text-decoration: none;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
}

.back-link:hover {
    text-decoration: underline;
}

.task-grid {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 20px;
    align-items: start;
    margin-bottom: 24px;
}

.task-card,
.chat-card,
.info-card {
    background: #ffffff;
    border-radius: 18px;
    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
    padding: 24px;
}

.task-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 18px;
}

.task-title {
    font-size: 30px;
    font-weight: 700;
    color: #0F172A;
    margin: 0;
    line-height: 1.1;
}

.task-description {
    margin-top: 14px;
    color: #475569;
    font-size: 16px;
    line-height: 1.7;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 16px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.status-terminé {
    background: #DCFCE7;
    color: #166534;
}

.status-en-cours {
    background: #DBEAFE;
    color: #1D4ED8;
}

.status-en-attente {
    background: #FEF3C7;
    color: #92400E;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.info-card {
    display: grid;
    gap: 16px;
}

.info-card h2,
.chat-card h2 {
    margin: 0 0 8px;
    font-size: 18px;
    color: #111827;
}

.info-item {
    background: #F8FAFC;
    border-radius: 14px;
    padding: 18px;
}

.info-label {
    display: block;
    margin-bottom: 8px;
    color: #64748B;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.info-value {
    color: #0F172A;
    font-size: 15px;
    margin: 0;
    line-height: 1.6;
}

.technicians-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
}

.technician-tag {
    background: #EFF6FF;
    color: #1D4ED8;
    padding: 10px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
}

.chat-card {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.chat-title {
    margin: 0 0 4px;
    font-size: 18px;
    color: #111827;
}

.chat-subtitle {
    margin: 0 0 20px;
    color: #475569;
    font-size: 14px;
}

.messages-container {
    flex: 1;
    overflow-y: auto;
    max-height: 520px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-right: 4px;
}

.message-bubble {
    max-width: 100%;
    padding: 14px 16px;
    border-radius: 18px;
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
}

.other-message {
    align-self: flex-start;
    background: #F3F4F6;
    color: #111827;
    border-bottom-left-radius: 4px;
}

.own-message {
    align-self: flex-end;
    background: #22C55E;
    color: #ffffff;
    border-bottom-right-radius: 4px;
}

.message-author {
    font-size: 12px;
    font-weight: 700;
    opacity: 0.8;
    margin-bottom: 8px;
}

.message-content {
    font-size: 15px;
    line-height: 1.7;
    white-space: pre-wrap;
}

.message-time {
    margin-top: 10px;
    font-size: 12px;
    opacity: 0.7;
}

.message-input-container {
    margin-top: 20px;
    border-top: 1px solid #E2E8F0;
    padding-top: 18px;
}

.message-form {
    display: flex;
    gap: 12px;
    align-items: flex-end;
}

.input-group {
    flex: 1;
    display: flex;
    gap: 12px;
}

.message-input {
    width: 100%;
    min-height: 48px;
    max-height: 180px;
    resize: none;
    border: 1px solid #CBD5E1;
    border-radius: 16px;
    padding: 14px 16px;
    font-size: 14px;
    line-height: 1.6;
    background: #F8FAFC;
    color: #0F172A;
    outline: none;
}

.message-input:focus {
    border-color: #60A5FA;
    background: #ffffff;
}

.send-button {
    background: #22C55E;
    border: none;
    color: white;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    transition: transform 0.15s ease, background 0.15s ease;
}

.send-button:hover {
    background: #16A34A;
    transform: translateY(-1px);
}

.no-messages {
    color: #64748B;
    font-size: 14px;
    padding: 24px;
    background: #F8FAFC;
    border-radius: 16px;
    text-align: center;
}

@media (max-width: 960px) {
    .task-grid {
        grid-template-columns: 1fr;
    }
}
</style>

<div class="task-details-container">
    <a href="{{ route('tasks.index') }}" class="back-link">← Retour aux tâches</a>

    <div class="task-grid">
        <div class="task-card">
            <div class="task-header">
                <div>
                    <h1 class="task-title">{{ $task->title }}</h1>
                    <p class="task-description">{{ $task->description ?: 'Aucune description disponible.' }}</p>
                </div>
                @php
                    $statusClass = 'status-en-attente';
                    if (strtolower($task->status) === 'terminé' || strtolower($task->status) === 'termine') {
                        $statusClass = 'status-terminé';
                    } elseif (strtolower($task->status) === 'en cours' || strtolower($task->status) === 'en cours') {
                        $statusClass = 'status-en-cours';
                    }
                @endphp
                <span class="status-badge {{ $statusClass }}">{{ $task->status ?: 'Non défini' }}</span>
            </div>

            <div class="summary-grid">
                <div class="info-item">
                    <span class="info-label">Créée par</span>
                    <p class="info-value">{{ $task->createdBy ?: 'Inconnu' }}</p>
                </div>
                <div class="info-item">
                    <span class="info-label">Date de création</span>
                    <p class="info-value">{{ optional($task->created_at)->format('d/m/Y H:i') ?: '-' }}</p>
                </div>
                <div class="info-item">
                    <span class="info-label">Début</span>
                    <p class="info-value">{{ $task->start_date ? $task->start_date->format('d/m/Y') : '-' }}</p>
                </div>
                <div class="info-item">
                    <span class="info-label">Fin</span>
                    <p class="info-value">{{ $task->end_date ? $task->end_date->format('d/m/Y') : '-' }}</p>
                </div>
            </div>

            <div class="info-card">
                <h2>Détails</h2>
                <p class="info-value">{{ $task->description ?: 'Pas de description fournie.' }}</p>
            </div>
        </div>

        <div class="chat-card">
            <h2 class="chat-title">Discussion d'équipe</h2>
            <p class="chat-subtitle">Les commentaires sont visibles par toute l'équipe.</p>
            <div class="messages-container" id="messages-container">
                @if($task->comments && $task->comments->count() > 0)
                    @foreach($task->comments as $comment)
                        <div class="message-bubble {{ $comment->user_id === auth()->id() ? 'own-message' : 'other-message' }}">
                            <div class="message-author">{{ $comment->user ? $comment->user->name : 'Utilisateur inconnu' }}</div>
                            <div class="message-content">{{ $comment->content }}</div>
                            <div class="message-time">{{ $comment->created_at->format('H:i') }}</div>
                        </div>
                    @endforeach
                @else
                    <div class="no-messages">Aucun commentaire pour l'instant. Commencez la conversation.</div>
                @endif
            </div>

            <div class="message-input-container">
                <form method="POST" action="{{ route('tasks.comments.store', $task) }}" class="message-form">
                    @csrf
                    <div class="input-group">
                        <textarea
                            name="content"
                            class="message-input"
                            placeholder="Écrire un message..."
                            rows="1"
                            required
                        ></textarea>
                        <button type="submit" class="send-button">📤</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    @if($task->technicians && $task->technicians->isNotEmpty())
        <div class="info-card">
            <h2>Techniciens assignés</h2>
            <div class="technicians-list">
                @foreach($task->technicians as $technician)
                    <span class="technician-tag">{{ $technician->name }}</span>
                @endforeach
            </div>
        </div>
    @endif
</div>
@endsection
