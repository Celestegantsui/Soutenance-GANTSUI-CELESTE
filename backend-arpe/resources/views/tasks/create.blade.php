@extends('layouts.app')

@section('title', 'Créer une tâche - ARPCE')

@section('content')

<style>
    .loading-spinner {
        display: none;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9999;
        text-align: center;
    }
    .loading-spinner.active {
        display: block;
    }
    .spinner {
        border: 5px solid rgba(0, 123, 255, 0.3);
        border-top: 5px solid #007bff;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        animation: spin 1s linear infinite;
        margin: 0 auto 15px;
    }
    @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
    .loading-text {
        color: #007bff;
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
    }
    .loading-timer {
        color: #666;
        font-size: 14px;
    }
</style>

<div id="loadingSpinner" class="loading-spinner">
    <div class="spinner"></div>
    <div class="loading-text">Création en cours...</div>
    <div class="loading-timer">Chargement : <span id="timerText">0</span>s</div>
</div>

<div class="page-header">
    <h1>Créer une tâche</h1>
    <p>Remplissez le formulaire pour créer une nouvelle tâche</p>
</div>

<div class="card" style="max-width: 600px;">
    <form id="taskForm" action="{{ route('tasks.store') }}" method="POST">
        @csrf

        <div class="form-group">
            <label for="title">Titre *</label>
            <input type="text" id="title" name="title" value="{{ old('title') }}" required placeholder="Ex: Réparer le serveur">
            @error('title')
                <small style="color: var(--danger);">{{ $message }}</small>
            @enderror
        </div>

        <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" name="description" placeholder="Décrivez la tâche en détail...">{{ old('description') }}</textarea>
            @error('description')
                <small style="color: var(--danger);">{{ $message }}</small>
            @enderror
        </div>

        <div class="form-group">
            <label for="status">Statut</label>
            <select id="status" name="status">
                <option value="">-- Aucun --</option>
                <option value="en attente" {{ old('status') == 'en attente' ? 'selected' : '' }}>En attente</option>
                <option value="en cours" {{ old('status') == 'en cours' ? 'selected' : '' }}>En cours</option>
                <option value="terminé" {{ old('status') == 'terminé' ? 'selected' : '' }}>Terminé</option>
            </select>
            @error('status')
                <small style="color: var(--danger);">{{ $message }}</small>
            @enderror
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
                <label for="start_date">Date de début</label>
                <input type="date" id="start_date" name="start_date" value="{{ old('start_date') }}">
                @error('start_date')
                    <small style="color: var(--danger);">{{ $message }}</small>
                @enderror
            </div>

            <div class="form-group">
                <label for="end_date">Date de fin</label>
                <input type="date" id="end_date" name="end_date" value="{{ old('end_date') }}">
                @error('end_date')
                    <small style="color: var(--danger);">{{ $message }}</small>
                @enderror
            </div>
        </div>

        <div class="form-group">
            <label for="technician_ids">Techniciens assignés</label>
            <select id="technician_ids" name="technician_ids[]" multiple>
                @if(isset($technicians))
                    @foreach($technicians as $technician)
                        <option value="{{ $technician->id }}" {{ in_array($technician->id, old('technician_ids', [])) ? 'selected' : '' }}>
                            {{ $technician->name }}
                        </option>
                    @endforeach
                @endif
            </select>
            @error('technician_ids')
                <small style="color: var(--danger);">{{ $message }}</small>
            @enderror
        </div>

        <div style="display: flex; gap: 15px; margin-top: 30px;">
            <button type="submit" class="btn btn-primary">✓ Créer la tâche</button>
            <a href="{{ route('tasks.index') }}" class="btn btn-secondary">Annuler</a>
        </div>
    </form>
</div>

<script>
    document.getElementById('taskForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Afficher le spinner de chargement
        const spinner = document.getElementById('loadingSpinner');
        spinner.classList.add('active');
        
        // Compte à rebours de 0 secondes
        let secondsLeft = 0;
        const timerElement = document.getElementById('timerText');
        
        const interval = setInterval(() => {
            secondsLeft--;
            timerElement.textContent = secondsLeft;
            
            if (secondsLeft <= 0) {
                clearInterval(interval);
                // Soumettre le formulaire après 0 secondes
                document.getElementById('taskForm').submit();
            }
        }, 1000);
    });
</script>

@endsection
