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
        // Check if columns don't exist before adding them
        if (!Schema::hasColumn('users', 'primary_color')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('primary_color')->default('#87CEEB')->nullable();
                $table->string('secondary_color')->default('#6c757d')->nullable();
                $table->string('background_color')->default('#ffffff')->nullable();
                $table->string('text_color')->default('#333333')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('users', 'primary_color')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn(['primary_color', 'secondary_color', 'background_color','text_color']);
            });
        }
    }
};
