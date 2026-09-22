<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
if($argc<4){fwrite(STDERR,"usage: worker <guard-dir> <ip> <hold-ms>\n");exit(64);}
putenv('NUTRITION_GEMINI_GUARD_DIR='.$argv[1]);
putenv('NUTRITION_GEMINI_GUARD_LOG=0');
putenv('NUTRITION_GEMINI_ENABLED=1');
define('NUTRITION_GEMINI_TEST_MODE',true);
$_SERVER['REMOTE_ADDR']=$argv[2];
require dirname(__DIR__).'/api/gemini.php';
while(function_exists('ob_get_level')&&ob_get_level()>0)@ob_end_clean();
try{
  nutrition_guard_begin('planner',1000);
  echo "ACQUIRED\n";flush();
  $ms=max(0,min(5000,(int)$argv[3]));if($ms)usleep($ms*1000);
  nutrition_guard_finish(true);
  echo "DONE\n";exit(0);
}catch(GeminiApiException $e){
  echo "DENIED {$e->errorCode} {$e->httpStatus} {$e->retryAfterSeconds}\n";exit(2);
}catch(Throwable $e){
  echo "ERROR ".get_class($e)." ".$e->getMessage()."\n";exit(3);
}
