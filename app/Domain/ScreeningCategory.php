<?php

namespace App\Domain;

enum ScreeningCategory: string
{
    case Normal = 'Normal';
    case Carrier = 'Carrier';
    case Penderita = 'Penderita';
}
