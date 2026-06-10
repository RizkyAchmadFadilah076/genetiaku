<?php

namespace App\Domain;


final class ScreeningRuleSet{
    private const RULES = [
        ['Riwayat keluarga Thalassemia', 2, 'Carrier'],
        ['Riwayat diagnosis Thalassemia', 5, 'Penderita'],
        ['Riwayat anemia', 1, 'Carrier'],
        ['Kadar Hb rendah', 1, 'Carrier'],
        ['Riwayat transfusi darah', 3, 'Penderita'],
        ['Gejala pendukung lainnya', 1, 'Normal'],
    ];

    
     
    public static function default(): array
    {
        return array_map(
            static fn (array $rule): KnowledgeBaseRule => new KnowledgeBaseRule(
                indicator: $rule[0],
                weight: $rule[1],
                classificationMapping: $rule[2],
            ),
            self::RULES,
        );
    }
}
