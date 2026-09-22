<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
if($argc<2){fwrite(STDERR,"usage: health-worker <guard-dir>\n");exit(64);}
putenv('NUTRITION_GEMINI_GUARD_DIR='.$argv[1]);
putenv('NUTRITION_GEMINI_GUARD_LOG=0');
putenv('NUTRITION_GEMINI_ENABLED=1');
define('NUTRITION_GEMINI_TEST_MODE',true);
$_SERVER['REMOTE_ADDR']='198.51.100.10';
require dirname(__DIR__).'/api/gemini.php';
$start=microtime(true);$status=nutrition_guard_public_status();$elapsed=(microtime(true)-$start)*1000;
echo json_encode(['status'=>$status,'elapsed_ms'=>$elapsed],JSON_UNESCAPED_SLASHES)."\n";
