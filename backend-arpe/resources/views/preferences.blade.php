@extends('layouts.app')

@section('content')
<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">
                    <h3>Préférences de Couleur (Administrateur)</h3>
                    <small class="text-muted">Configurez vos couleurs personnelles - Ces changements n'affectent que votre compte</small>
                </div>
                <div class="card-body">
                    @if (!Auth::user()->isAdmin())
                        <div class="alert alert-warning" role="alert">
                            <strong>Accès restreint</strong><br>
                            Seuls les administrateurs peuvent personnaliser les couleurs de l'interface.<br>
                            En tant que technicien, vous utilisez la couleur par défaut (bleu ciel).
                        </div>
                        <a href="{{ route('tasks.index') }}" class="btn btn-primary">Retour aux tâches</a>
                    @else
                        <form id="colorPreferencesForm">
                            @csrf

                            <div class="form-group mb-4">
                                <label for="primary_color" class="form-label">Couleur Primaire</label>
                                <div class="input-group">
                                    <input type="color" class="form-control form-control-color"
                                           id="primary_color" name="primary_color"
                                           value="{{ $primaryColor }}" style="width: 100px;">
                                    <input type="text" class="form-control"
                                           id="primary_color_text"
                                           value="{{ $primaryColor }}" readonly>
                                </div>
                                <small class="text-muted">Couleur principale utilisée dans l'interface (navbar, boutons principaux)</small>
                            </div>

                            <div class="form-group mb-4">
                                <label for="secondary_color" class="form-label">Couleur Secondaire</label>
                                <div class="input-group">
                                    <input type="color" class="form-control form-control-color"
                                           id="secondary_color" name="secondary_color"
                                           value="{{ $secondaryColor }}" style="width: 100px;">
                                    <input type="text" class="form-control"
                                           id="secondary_color_text"
                                           value="{{ $secondaryColor }}" readonly>
                                </div>
                                <small class="text-muted">Couleur secondaire pour les éléments complémentaires (table headers, etc.)</small>
                            </div>

                            <div class="form-group mb-4">
                                <label for="background_color" class="form-label">Couleur de Fond</label>
                                <div class="input-group">
                                    <input type="color" class="form-control form-control-color"
                                           id="background_color" name="background_color"
                                           value="{{ $backgroundColor }}" style="width: 100px;">
                                    <input type="text" class="form-control"
                                           id="background_color_text"
                                           value="{{ $backgroundColor }}" readonly>
                                </div>
                                <small class="text-muted">Couleur de fond de la page</small>
                            </div>

                            <div class="form-group mb-4">
                                <label for="text_color" class="form-label">Couleur du Texte</label>
                                <div class="input-group">
                                    <input type="color" class="form-control form-control-color"
                                           id="text_color" name="text_color"
                                           value="{{ $textColor }}" style="width: 100px;">
                                    <input type="text" class="form-control"
                                           id="text_color_text"
                                           value="{{ $textColor }}" readonly>
                                </div>
                                <small class="text-muted">Couleur du texte principal</small>
                            </div>

                            <div class="d-flex gap-2">
                                <button type="submit" class="btn btn-primary">Enregistrer mes Préférences</button>
                                <button type="button" class="btn btn-outline-secondary" onclick="resetToDefaults()">Réinitialiser aux Défauts</button>
                                <a href="{{ route('tasks.index') }}" class="btn btn-secondary">Retour</a>
                            </div>
                        </form>

                        <div id="successMessage" class="alert alert-success mt-3" style="display: none;"></div>
                        <div id="errorMessage" class="alert alert-danger mt-3" style="display: none;"></div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    // Sync color inputs with text inputs
    document.getElementById('primary_color').addEventListener('input', function() {
        document.getElementById('primary_color_text').value = this.value;
    });
    document.getElementById('secondary_color').addEventListener('input', function() {
        document.getElementById('secondary_color_text').value = this.value;
    });
    document.getElementById('background_color').addEventListener('input', function() {
        document.getElementById('background_color_text').value = this.value;
    });
    document.getElementById('text_color').addEventListener('input', function() {
        document.getElementById('text_color_text').value = this.value;
    });

    // Handle form submission
    document.getElementById('colorPreferencesForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            primary_color: document.getElementById('primary_color').value,
            secondary_color: document.getElementById('secondary_color').value,
            background_color: document.getElementById('background_color').value,
            text_color: document.getElementById('text_color').value,
            _token: document.querySelector('input[name="_token"]').value
        };

        fetch('{{ route("preferences") }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                document.getElementById('successMessage').textContent = data.message;
                document.getElementById('successMessage').style.display = 'block';
                document.getElementById('errorMessage').style.display = 'none';

                // Reload the page after 2 seconds to apply new colors
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } else if (data.error) {
                document.getElementById('errorMessage').textContent = data.error;
                document.getElementById('errorMessage').style.display = 'block';
                document.getElementById('successMessage').style.display = 'none';
            }
        })
        .catch(error => {
            document.getElementById('errorMessage').textContent = 'Une erreur est survenue: ' + error.message;
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('successMessage').style.display = 'none';
        });
    });

    // Reset to defaults function
    function resetToDefaults() {
        document.getElementById('primary_color').value = '#87CEEB';
        document.getElementById('primary_color_text').value = '#87CEEB';
        document.getElementById('secondary_color').value = '#6c757d';
        document.getElementById('secondary_color_text').value = '#6c757d';
        document.getElementById('background_color').value = '#ffffff';
        document.getElementById('background_color_text').value = '#ffffff';
        document.getElementById('text_color').value = '#333333';
        document.getElementById('text_color_text').value = '#333333';
    }
</script>
@endsection
