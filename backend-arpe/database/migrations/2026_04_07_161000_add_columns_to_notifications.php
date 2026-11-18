<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Add missing columns if they don't exist
            if (!Schema::hasColumn('notifications', 'title')) {
                $table->string('title')->nullable()->after('type');
            }
            if (!Schema::hasColumn('notifications', 'message')) {
                $table->text('message')->nullable()->after('title');
            }
            if (!Schema::hasColumn('notifications', 'sender_id')) {
                $table->foreignId('sender_id')->nullable()->constrained('users')->onDelete('set null')->after('data');
            }
            if (!Schema::hasColumn('notifications', 'is_read')) {
                $table->boolean('is_read')->default(false)->after('sender_id');
            }
            if (!Schema::hasColumn('notifications', 'action_url')) {
                $table->string('action_url')->nullable()->after('is_read');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['title', 'message', 'sender_id', 'is_read', 'action_url']);
        });
    }
};
