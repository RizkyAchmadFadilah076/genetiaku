# Class Diagram Genetikaku

Diagram berikut merangkum struktur kelas utama pada aplikasi Genetikaku. Fokus diagram ini adalah modul skrining Thalassemia, prediksi karakteristik bayi dengan Naive Bayes, data latih, basis pengetahuan, dan konten publik.

```mermaid
classDiagram
    direction LR

    class ScreeningController {
        +SESSION_KEY: string
        +show() Response
        +store(ScreeningRequest, ScreeningEngine) RedirectResponse
        -loadRules() KnowledgeBaseRuleDto[]
        -mapAnswers(array) array
        -selectedIndicators(array) string[]
    }

    class PredictionController {
        +create(Request) Response
        +store(PredictionRequest, NaiveBayesClassifier) Response
        +print(PredictionResult) Response
        -buildClassifierInput(array, ScreeningResult) array
        -loadTrainingRows() TrainingRow[]
        -educationalContent() array
        -disclaimer() string
        -phenotypeOptions() array
        -phenotypeIllustrations() array
    }

    class ScreeningEngine {
        +classify(array answers, KnowledgeBaseRuleDto[] rules) ScreeningCategory
        -isAffirmative(mixed answer) bool
        -normalizeCategory(string mapping) ScreeningCategory
        -minOrValue(?int current, int candidate) int
    }

    class NaiveBayesClassifier {
        +predict(array input, TrainingRow[] training) PredictionOutcome
        -guardAgainstEmptyTrainingData(TrainingRow[] training) void
        -guardAgainstUnknownAttributeValues(array input, TrainingRow[] training) void
        -compute(array input, TrainingRow[] training) PredictionOutcome
        -unnormalizedScores(string variable, array input, TrainingRow[] training, int n, array distinctValueCounts) array
        -jointCount(TrainingRow[] training, string variable, string class, string attribute, string value) int
        -classWithMaxScore(array scores) string
        -normalize(array scores) array
        -distinctValueCounts(TrainingRow[] training) array
    }

    class ScreeningResult {
        +int id
        +string father_name
        +string mother_name
        +ScreeningCategory father_result
        +ScreeningCategory mother_result
        +array father_indicators
        +array mother_indicators
        +predictionResult() HasOne
    }

    class PredictionResult {
        +int id
        +int screening_result_id
        +array physical_result
        +ThalassemiaRisk thalassemia_risk
        +array probabilities
        +screeningResult() BelongsTo
    }

    class KnowledgeBaseRuleModel {
        +int id
        +string slug
        +string indicator
        +int weight
        +string classification_mapping
        +string illustration_path
        +getIllustrationUrlAttribute() string
        +getIllustrationTypeAttribute() string
    }

    class TrainingData {
        +int id
        +string father_blood
        +string father_iris
        +string father_hair
        +string father_ear
        +string father_thalassemia
        +string mother_blood
        +string mother_iris
        +string mother_hair
        +string mother_ear
        +string mother_thalassemia
        +string baby_blood
        +string baby_iris
        +string baby_hair
        +string baby_ear
        +string baby_thalassemia_risk
    }

    class Phenotype {
        +int id
        +PhenotypeCategory category
        +string value
        +string illustration_path
        +getIllustrationUrlAttribute() string
        +getIllustrationTypeAttribute() string
    }

    class TrainingRow {
        +string fatherBlood
        +string fatherIris
        +string fatherHair
        +string fatherEar
        +string fatherThalassemia
        +string motherBlood
        +string motherIris
        +string motherHair
        +string motherEar
        +string motherThalassemia
        +string babyBlood
        +string babyIris
        +string babyHair
        +string babyEar
        +string babyThalassemiaRisk
        +fromArray(array attributes) TrainingRow
        +inputAttributes() array
        +outputClasses() array
    }

    class PredictionOutcome {
        +array physical
        +ThalassemiaRisk thalassemiaRisk
        +array probabilities
    }

    class KnowledgeBaseRuleDto {
        +string indicator
        +int weight
        +string classificationMapping
        +fromArray(array attributes) KnowledgeBaseRuleDto
    }

    class ScreeningCategory {
        <<enumeration>>
        Normal
        Carrier
        Penderita
    }

    class ThalassemiaRisk {
        <<enumeration>>
        Minor
        Intermedia
        Mayor
    }

    class PhenotypeCategory {
        <<enumeration>>
        GolonganDarah
        WarnaIris
        TeksturRambut
        BentukCuping
    }

    class Article {
        +int id
        +string title
        +string slug
        +string summary
        +string content
        +string status
        +string image_path
        +getImageUrlAttribute() string
    }

    class AboutPage {
        +int id
        +string title
        +string content
        +string image_path
        +getImageUrlAttribute() string
    }

    class MediaAsset {
        +int id
        +string key
        +string path
        +string type
        +string alt
        +getUrlAttribute() string
    }

    ScreeningController ..> ScreeningEngine : uses
    ScreeningController ..> KnowledgeBaseRuleModel : loads rules
    ScreeningController ..> KnowledgeBaseRuleDto : maps to DTO
    ScreeningController ..> ScreeningResult : creates
    ScreeningController ..> MediaAsset : reads illustration

    PredictionController ..> NaiveBayesClassifier : uses
    PredictionController ..> ScreeningResult : reads session result
    PredictionController ..> PredictionResult : creates/prints
    PredictionController ..> TrainingData : loads
    PredictionController ..> TrainingRow : maps data
    PredictionController ..> Phenotype : loads options
    PredictionController ..> PredictionOutcome : receives

    ScreeningEngine ..> KnowledgeBaseRuleDto : evaluates
    ScreeningEngine ..> ScreeningCategory : returns

    NaiveBayesClassifier ..> TrainingRow : consumes
    NaiveBayesClassifier ..> PredictionOutcome : returns
    NaiveBayesClassifier ..> ScreeningCategory : validates
    NaiveBayesClassifier ..> ThalassemiaRisk : maps output
    NaiveBayesClassifier ..> PhenotypeCategory : labels physical output

    ScreeningResult "1" --> "0..1" PredictionResult : has
    PredictionResult "1" --> "1" ScreeningResult : belongs to

    ScreeningResult ..> ScreeningCategory : casts father/mother result
    PredictionResult ..> ThalassemiaRisk : casts risk
    Phenotype ..> PhenotypeCategory : casts category
```

## Catatan untuk laporan

- `ScreeningController` menangani Tahap 1, yaitu skrining orang tua berdasarkan indikator dan basis pengetahuan.
- `ScreeningEngine` adalah service domain yang mengklasifikasikan hasil skrining menjadi `Normal`, `Carrier`, atau `Penderita`.
- `PredictionController` menangani Tahap 2 dan Tahap 3, yaitu input fenotipe orang tua, pemanggilan mesin Naive Bayes, penyimpanan hasil, dan cetak laporan.
- `NaiveBayesClassifier` menghitung probabilitas posterior dari `TrainingRow[]` dan menghasilkan `PredictionOutcome`.
- `ScreeningResult` berelasi satu-ke-nol/satu dengan `PredictionResult`, karena satu hasil skrining dapat memiliki satu hasil prediksi yang terkait.
- `TrainingData`, `Phenotype`, dan `KnowledgeBaseRuleModel` adalah data master yang dikelola aplikasi untuk prediksi dan skrining.
