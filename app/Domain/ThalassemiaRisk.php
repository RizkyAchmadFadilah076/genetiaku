<?php

namespace App\Domain;

enum ThalassemiaRisk: string
{
    case Minor = 'Minor';
    case Intermedia = 'Intermedia';
    case Mayor = 'Mayor';
}
