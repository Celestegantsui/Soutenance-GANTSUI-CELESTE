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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // task_created, task_updated, task_assigned, etc.
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // Additional data like task_id, user_id, etc.
            $table->unsignedBigInteger('user_id'); // Recipient
            $table->unsignedBigInteger('sender_id')->nullable(); // Who sent the notification
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->string('action_url')->nullable(); // URL to redirect when clicked
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('sender_id')->references('id')->on('users')->onDelete('set null');

            $table->index(['user_id', 'is_read']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
