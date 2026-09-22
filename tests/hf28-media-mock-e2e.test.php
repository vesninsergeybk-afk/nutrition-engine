<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}

$guardDir=sys_get_temp_dir().'/nutrition-hf28-media-test-'.getmypid();
@mkdir($guardDir,0700,true);
putenv('NUTRITION_GEMINI_GUARD_DIR='.$guardDir);
putenv('NUTRITION_GEMINI_GUARD_LOG=1');
putenv('NUTRITION_GEMINI_ENABLED=1');
putenv('NUTRITION_GEMINI_MEDIA_CLIENT_MINUTE=100');
putenv('NUTRITION_GEMINI_MEDIA_SUBNET_MINUTE=100');
putenv('NUTRITION_GEMINI_MEDIA_GLOBAL_MINUTE=100');
putenv('NUTRITION_GEMINI_MEDIA_CLIENT_10M=100');
putenv('NUTRITION_GEMINI_MEDIA_CLIENT_HOUR=100');
putenv('NUTRITION_GEMINI_MEDIA_CLIENT_DAY=100');
putenv('NUTRITION_GEMINI_MEDIA_TOKENS_MINUTE=2000000');
putenv('NUTRITION_GEMINI_MEDIA_TOKENS_HOUR=5000000');
putenv('NUTRITION_GEMINI_GLOBAL_TOKENS_MINUTE=2000000');
putenv('NUTRITION_GEMINI_GLOBAL_TOKENS_HOUR=5000000');
putenv('NUTRITION_GEMINI_COST_MICRO_USD_PER_MINUTE=1000000000000');
putenv('NUTRITION_GEMINI_COST_MICRO_USD_PER_HOUR=1000000000000');
putenv('NUTRITION_GEMINI_COST_MICRO_USD_PER_DAY=1000000000000');
putenv('NUTRITION_GEMINI_MEDIA_COST_MICRO_USD_PER_DAY=1000000000000');
define('NUTRITION_GEMINI_TEST_MODE',true);
$_SERVER['REMOTE_ADDR']='198.51.100.28';
require dirname(__DIR__).'/api/gemini.php';

$audioPath='/mnt/data/test_ration_ru.wav';
if(!is_file($audioPath))throw new RuntimeException('Test audio missing: '.$audioPath);
$audio=(string)file_get_contents($audioPath);
if($audio==='')throw new RuntimeException('Test audio is empty.');

$files=[[
    'name'=>'test-ration-ru.wav',
    'mime'=>'audio/wav',
    'size'=>strlen($audio),
    'data'=>$audio,
    'kind'=>'audio'
]];
$meta=[[
    'source_id'=>'media_test_audio',
    'kind'=>'audio',
    'meal_code'=>'full_day',
    'label_ru'=>'Весь день',
    'filename'=>'test-ration-ru.wav',
    'order'=>1
]];
$context=str_repeat('Проверка русской строки: творог, яблоко и чай. ',30).'Финал ✅';

$modelResult=[
    'summary_ru'=>'Распознан один продукт из голосовой записи.',
    'meals'=>[[
        'meal_code'=>'full_day',
        'label_ru'=>'Весь день',
        'source_ids'=>['media_test_audio'],
        'items'=>[[
            'item_ref'=>'item_1',
            'source_id'=>'media_test_audio',
            'source_ids'=>['media_test_audio'],
            'source_type'=>'audio',
            'observed_name_ru'=>'творог',
            'source_transcript_ru'=>'творог двести граммов',
            'alternate_search_terms'=>['творог натуральный'],
            'preparation_state'=>'без приготовления',
            'preparation_method'=>'none',
            'preparation_confidence'=>0.98,
            'product_family_hint'=>'творог',
            'food_family_id'=>'',
            'added_fat_mode'=>'not_applicable',
            'skin_state'=>'not_applicable',
            'breading_state'=>'not_applicable',
            'drain_state'=>'not_applicable',
            'doneness_state'=>'not_applicable',
            'storage_state'=>'chilled',
            'weight_basis_hint'=>'ready_to_eat_weight',
            'consumption_scope'=>'single_portion',
            'requires_user_confirmation'=>false,
            'recognition_issue_code'=>'',
            'category_hint'=>'Молочные продукты',
            'estimated_grams'=>200,
            'grams_source'=>'explicit',
            'confidence'=>0.98,
            'notes'=>''
        ]]
    ]],
    'warnings'=>[]
];

$observed=[];
$GLOBALS['NUTRITION_GEMINI_HTTP_MOCK']=static function(string $endpoint,string $encoded,array $headers,int $timeout)use(&$observed,$modelResult):array{
    $request=json_decode($encoded,true);
    $system=is_array($request)?(string)($request['systemInstruction']['parts'][0]['text']??''):'';
    $parts=is_array($request)?($request['contents'][0]['parts']??[]):[];
    $hasAudio=false;$hasContext=false;
    foreach(is_array($parts)?$parts:[] as $part){
        if(isset($part['inlineData']['mimeType'])&&str_starts_with((string)$part['inlineData']['mimeType'],'audio/'))$hasAudio=true;
        if(isset($part['text'])&&str_contains((string)$part['text'],'Проверка русской строки'))$hasContext=true;
    }
    $observed=[
        'endpoint'=>$endpoint,
        'encoded'=>$encoded,
        'headers'=>$headers,
        'timeout'=>$timeout,
        'request_json_valid'=>is_array($request),
        'system_present'=>$system!==''&&str_contains($system,'продукт'),
        'audio_present'=>$hasAudio,
        'context_present'=>$hasContext
    ];
    $candidateText=json_encode($modelResult,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    $raw=json_encode([
        'candidates'=>[[
            'content'=>['parts'=>[['text'=>$candidateText]]],
            'finishReason'=>'STOP'
        ]],
        'usageMetadata'=>[
            'promptTokenCount'=>1300,
            'candidatesTokenCount'=>260,
            'totalTokenCount'=>1560
        ]
    ],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    return ['status'=>200,'raw'=>$raw,'transport_error'=>'','headers'=>['content-type'=>'application/json']];
};
nutrition_guard_begin('media',250000);
try{
    $result=call_media_recognition([['slot'=>'primary','key'=>'dummy-hf28-key']],$files,$meta,$context);
    nutrition_guard_finish(true);
}catch(Throwable $e){
    try{nutrition_guard_finish(false,'test_failure',0,false,false);}catch(Throwable){}
    throw $e;
}finally{
    unset($GLOBALS['NUTRITION_GEMINI_HTTP_MOCK']);
}

$item=$result['result']['meals'][0]['items'][0]??null;
$assertions=[
    'mode'=>($result['mode']??'')==='structured_json',
    'name'=>is_array($item)&&($item['observed_name_ru']??'')==='творог',
    'grams'=>is_array($item)&&abs((float)($item['estimated_grams']??0)-200)<0.01,
    'transcript'=>is_array($item)&&str_contains((string)($item['source_transcript_ru']??''),'двести'),
    'source'=>is_array($item)&&($item['source_id']??'')==='media_test_audio',
    'utf8_request'=>isset($observed['encoded'])&&preg_match('//u',(string)$observed['encoded'])===1,
    'provider_request_json'=>(bool)($observed['request_json_valid']??false),
    'system_instruction'=>(bool)($observed['system_present']??false),
    'audio_part'=>(bool)($observed['audio_present']??false),
    'context_part'=>(bool)($observed['context_present']??false),
    'single_provider_call'=>(int)($result['proxy_meta']['request_count']??0)===1,
    'finish_reason'=>($result['finish_reason']??'')==='STOP'
];
foreach($assertions as $name=>$ok)if(!$ok)throw new RuntimeException('Assertion failed: '.$name);

foreach(glob($guardDir.'/*')?:[] as $file){if(is_file($file))@unlink($file);}
@rmdir($guardDir);
echo json_encode(['ok'=>true,'assertions'=>count($assertions),'mode'=>$result['mode'],'item'=>$item['observed_name_ru'],'grams'=>$item['estimated_grams']],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT)."\n";
