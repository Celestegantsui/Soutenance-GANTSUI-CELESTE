<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    private const ROLE_TO_DATABASE = [
        'admin' => 'admin',
        'technician' => 'technicien',
    ];

    private const STATUS_TO_DATABASE = [
        'active' => 'actif',
        'inactive' => 'inactif',
    ];

    /**
     * Retourne la liste des utilisateurs (techniciens) pour les selects.
     */
    public function index()
    {
        return User::active()->select('id', 'name')->get();
    }

    /**
     * Liste des comptes pour l'administration.
     */
    public function managementIndex()
    {
        return response()->json(User::query()->get()->map(fn (User $user) => $this->userResponse($user)));
    }

    /**
     * Crée un compte administrable depuis l'API.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), $this->rules(), $this->messages());

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();
        $data['role'] = self::ROLE_TO_DATABASE[$data['role']];
        $data['status'] = self::STATUS_TO_DATABASE[$data['status']];
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return response()->json([
            'message' => 'Compte créé avec succès.',
            'data' => $this->userResponse($user),
        ], 201);
    }

    /**
     * Modifie un compte sans remplacer le mot de passe lorsqu'il est vide.
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $validator = Validator::make($request->all(), $this->rules($user), $this->messages());

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();
        $data['role'] = self::ROLE_TO_DATABASE[$data['role']];
        $data['status'] = self::STATUS_TO_DATABASE[$data['status']];

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);
        $user = $user->fresh();

        if (!$user->isActive()) {
            $user->receivedNotifications()->delete();
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'Compte modifié avec succès.',
            'data' => $this->userResponse($user),
        ]);
    }

    /**
     * Supprime un autre compte, mais jamais celui de l'administrateur connecté.
     */
    public function destroy(Request $request, $id)
    {
        if ((int) $request->user()->id === (int) $id) {
            return response()->json([
                'message' => 'Vous ne pouvez pas supprimer votre propre compte.',
            ], 403);
        }

        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'Compte supprimé avec succès.']);
    }

    private function rules(?User $user = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user?->id),
            ],
            'password' => $user
                ? ['nullable', 'string', 'min:8']
                : ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(array_keys(self::ROLE_TO_DATABASE))],
            'gender' => ['required', Rule::in(['female', 'male'])],
            'status' => ['required', Rule::in(array_keys(self::STATUS_TO_DATABASE))],
        ];
    }

    private function messages(): array
    {
        return [
            'required' => 'Le champ :attribute est obligatoire.',
            'email.email' => 'Cette adresse e-mail est invalide.',
            'email.unique' => 'Cette adresse e-mail est déjà utilisée.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'role.in' => 'Le rôle sélectionné est invalide.',
            'status.in' => 'L’état sélectionné est invalide.',
        ];
    }

    private function validationError($errors)
    {
        return response()->json([
            'message' => 'Les données sont invalides.',
            'errors' => $errors,
        ], 422);
    }

    private function userResponse(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role === 'admin' ? 'admin' : 'technician',
            'gender' => $user->gender,
            'status' => $user->status === 'actif' ? 'active' : 'inactive',
        ];
    }
}
