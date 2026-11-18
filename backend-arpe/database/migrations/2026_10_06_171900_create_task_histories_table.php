<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('task_id')->nullable();
            $table->string('title')->nullable();
            $table->string('status')->nullable();
            $table->string('createdBy')->nullable();
            $table->string('event_type')->nullable();
            $table->json('event_data')->nullable();
            $table->timestamps();

            $table->index('task_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_histories');
    }
};
