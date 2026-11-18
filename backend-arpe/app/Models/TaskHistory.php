<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskHistory extends Model
{
    use HasFactory;
    
    protected $fillable = ['task_id', 'title', 'status', 'createdBy', 'event_type', 'event_data'];

    protected $casts = [
        'event_data' => 'array',
    ];
}
